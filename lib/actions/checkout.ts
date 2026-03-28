'use server'

import { revalidatePath } from 'next/cache'
import { CHECKOUT_DELIVERY_TYPES, SUPPORTED_CHECKOUT_PAYMENT_METHODS, type CreateCheckoutOrderInput } from '@/lib/checkout'
import { getCheckoutFinancialSummary } from '@/lib/checkout-pricing'
import { env } from '@/lib/env'
import { sendOrderConfirmationNotification } from '@/lib/notifications'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getEarnedPoints } from '@/lib/utils/points'
import { getLineTotal, getTieredUnitPrice } from '@/lib/utils/price'
import type { ActionResult, PaymentMethod, Promotion } from '@/types'

const supportedDeliveryTypes = new Set(
  CHECKOUT_DELIVERY_TYPES.map((option) => option.value)
)

const supportedPaymentMethods = new Set(
  SUPPORTED_CHECKOUT_PAYMENT_METHODS.map((option) => option.value)
)

function toNumber(value: number | string | null | undefined) {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string' && value.trim() !== '') {
    return Number(value)
  }

  return 0
}

function toNullableNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string' && value.trim() !== '') {
    return Number(value)
  }

  return null
}

function normalizeOptionalText(value: string | null | undefined, maxLength: number) {
  const nextValue = value?.trim() ?? ''

  if (!nextValue) {
    return null
  }

  return nextValue.slice(0, maxLength)
}

function normalizeCheckoutItems(input: CreateCheckoutOrderInput['items']) {
  if (!Array.isArray(input) || input.length === 0) {
    throw new Error('Le panier est vide ou invalide.')
  }

  const groupedItems = new Map<string, number>()

  for (const rawItem of input) {
    if (!rawItem || typeof rawItem.productId !== 'string') {
      throw new Error('Une ligne du panier est invalide.')
    }

    const productId = rawItem.productId.trim()
    const quantity = Number(rawItem.quantity)

    if (!productId) {
      throw new Error('Une ligne du panier ne reference aucun produit.')
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error('Chaque produit du panier doit avoir une quantite entiere positive.')
    }

    groupedItems.set(productId, (groupedItems.get(productId) ?? 0) + quantity)
  }

  return Array.from(groupedItems.entries()).map(([productId, quantity]) => ({
    productId,
    quantity,
  }))
}

function normalizeCheckoutDate(value: string | null | undefined) {
  const nextValue = value?.trim() ?? ''

  if (!nextValue) {
    return null
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(nextValue)) {
    throw new Error('La date de livraison est invalide.')
  }

  const providedDate = new Date(`${nextValue}T00:00:00`)

  if (Number.isNaN(providedDate.getTime())) {
    throw new Error('La date de livraison est invalide.')
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (providedDate < today) {
    throw new Error('La date de livraison ne peut pas etre dans le passe.')
  }

  return nextValue
}

function revalidateCheckoutPaths(orderId: string) {
  revalidatePath('/cart')
  revalidatePath('/checkout')
  revalidatePath('/account/dashboard')
  revalidatePath('/account/orders')
  revalidatePath(`/account/orders/${orderId}`)
  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath(`/order-confirmation/${orderId}`)
  revalidatePath(`/track/${orderId}`)
}

function getFinalOrderPaymentMethod(input: {
  selectedPaymentMethod: PaymentMethod
  remainingPaymentAmount: number
  pointsPaymentAmount: number
  accountCreditApplied: number
}): PaymentMethod {
  if (input.remainingPaymentAmount > 0) {
    return input.selectedPaymentMethod
  }

  if (input.accountCreditApplied > 0) {
    return 'account_credit'
  }

  if (input.pointsPaymentAmount > 0) {
    return 'loyalty_points'
  }

  return input.selectedPaymentMethod
}

async function cleanupCheckoutFailure(input: {
  supabase: any
  orderId: string
  customerId: string
  restoreCreditBalance: number | null
  rollbackPromotions: Promotion[]
  deleteRedeemedPointsTransaction: boolean
}) {
  if (input.deleteRedeemedPointsTransaction) {
    await input.supabase
      .from('loyalty_transactions')
      .delete()
      .eq('order_id', input.orderId)
      .eq('customer_id', input.customerId)
      .eq('type', 'redeemed')
  }

  if (input.rollbackPromotions.length > 0) {
    await input.supabase
      .from('promo_usages')
      .delete()
      .eq('order_id', input.orderId)
      .eq('customer_id', input.customerId)

    await Promise.all(
      input.rollbackPromotions.map((promotion) =>
        input.supabase
          .from('promotions')
          .update({
            current_uses: promotion.current_uses,
          })
          .eq('id', promotion.id)
      )
    )
  }

  if (input.restoreCreditBalance !== null) {
    await input.supabase
      .from('customer_profiles')
      .update({
        credit_balance: input.restoreCreditBalance,
      })
      .eq('id', input.customerId)
  }

  await input.supabase.from('orders').delete().eq('id', input.orderId)
}

function isMissingPaymentTransactionsTableError(message: string) {
  const normalized = message.toLowerCase()

  return (
    normalized.includes('payment_transactions') &&
    (normalized.includes('does not exist') ||
      normalized.includes('schema cache') ||
      normalized.includes('could not find') ||
      normalized.includes('relation'))
  )
}

export async function createCheckoutOrder(
  input: CreateCheckoutOrderInput
): Promise<
  ActionResult<{
    orderId: string
    reference: string
    totalAmount: number
  }>
> {
  try {
    if (!env.hasSupabase()) {
      return {
        success: false,
        error: "Supabase n'est pas encore configure pour creer une commande.",
      }
    }

    if (!env.hasServiceRole()) {
      return {
        success: false,
        error:
          'La variable SUPABASE_SERVICE_ROLE_KEY est requise pour finaliser le checkout de maniere fiable.',
      }
    }

    const deliveryType = input.deliveryType
    const paymentMethod = input.paymentMethod

    if (!supportedDeliveryTypes.has(deliveryType)) {
      return {
        success: false,
        error: 'Le type de livraison choisi est invalide.',
      }
    }

    if (!supportedPaymentMethods.has(paymentMethod)) {
      return {
        success: false,
        error: 'Le mode de paiement choisi nest pas encore pris en charge.',
      }
    }

    const items = normalizeCheckoutItems(input.items)
    const deliveryDate = normalizeCheckoutDate(input.deliveryDate)
    const deliveryInstructions = normalizeOptionalText(input.deliveryInstructions, 600)
    const customerNotes = normalizeOptionalText(input.customerNotes, 1200)
    const deliverySlot = normalizeOptionalText(input.deliverySlot, 80)

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        error: 'Vous devez etre connecte pour passer une commande.',
      }
    }

    const serviceClient = await createServiceClient()

    const { data: profileData, error: profileError } = await serviceClient
      .from('customer_profiles')
      .select(
        'id, full_name, email, phone, customer_type, loyalty_level, is_blacklisted, loyalty_points, credit_balance'
      )
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      throw new Error(`Impossible de verifier le profil client: ${profileError.message}`)
    }

    if (!profileData) {
      return {
        success: false,
        error: 'Aucun profil client valide nest rattache a ce compte.',
      }
    }

    if (profileData.is_blacklisted) {
      return {
        success: false,
        error: 'Ce compte client est actuellement bloque pour la prise de commande.',
      }
    }

    let addressData:
      | {
          id: string
          full_address: string
          city: string
          zone: string
          phone: string | null
        }
      | null = null

    let deliveryZoneData:
      | {
          id: string
          name: string
          city: string
          delivery_fee: number | string
          min_order_amount: number | string
          available_slots: string[] | null
        }
      | null = null

    if (deliveryType === 'delivery') {
      if (!input.deliveryAddressId) {
        return {
          success: false,
          error: 'Selectionnez une adresse de livraison pour continuer.',
        }
      }

      if (!input.deliveryZoneId) {
        return {
          success: false,
          error: 'Selectionnez une zone de livraison pour continuer.',
        }
      }

      const [{ data: nextAddress, error: addressError }, { data: nextZone, error: zoneError }] =
        await Promise.all([
          serviceClient
            .from('customer_addresses')
            .select('id, full_address, city, zone, phone')
            .eq('id', input.deliveryAddressId)
            .eq('customer_id', user.id)
            .maybeSingle(),
          serviceClient
            .from('delivery_zones')
            .select('id, name, city, delivery_fee, min_order_amount, available_slots')
            .eq('id', input.deliveryZoneId)
            .eq('is_active', true)
            .maybeSingle(),
        ])

      if (addressError) {
        throw new Error(`Impossible de verifier l'adresse choisie: ${addressError.message}`)
      }

      if (zoneError) {
        throw new Error(`Impossible de verifier la zone choisie: ${zoneError.message}`)
      }

      if (!nextAddress) {
        return {
          success: false,
          error: 'Ladresse selectionnee nest pas disponible pour ce compte.',
        }
      }

      if (!nextZone) {
        return {
          success: false,
          error: 'La zone de livraison selectionnee nest pas disponible.',
        }
      }

      const availableSlots = Array.isArray(nextZone.available_slots)
        ? nextZone.available_slots
        : []

      if (availableSlots.length > 0 && !deliverySlot) {
        return {
          success: false,
          error: 'Choisissez un creneau de livraison disponible.',
        }
      }

      if (deliverySlot && availableSlots.length > 0 && !availableSlots.includes(deliverySlot)) {
        return {
          success: false,
          error: 'Le creneau de livraison selectionne nest pas valide.',
        }
      }

      addressData = nextAddress
      deliveryZoneData = nextZone
    }

    const [minOrderSettingResult, loyaltyPointValueResult, loyaltyPointsRateResult, productRowsResult, promotionsResult] =
      await Promise.all([
        serviceClient
          .from('shop_settings')
          .select('value')
          .eq('key', 'min_order_amount')
          .maybeSingle(),
        serviceClient
          .from('shop_settings')
          .select('value')
          .eq('key', 'loyalty_point_value')
          .maybeSingle(),
        serviceClient
          .from('shop_settings')
          .select('value')
          .eq('key', 'loyalty_points_rate')
          .maybeSingle(),
        serviceClient
          .from('products')
          .select(
            [
              'id',
              'name',
              'unit',
              'base_price',
              'price_tier_1_qty',
              'price_tier_1_price',
              'price_tier_2_qty',
              'price_tier_2_price',
              'price_tier_3_qty',
              'price_tier_3_price',
              'stock_quantity',
              'is_available',
            ].join(', ')
          )
          .in(
            'id',
            items.map((item) => item.productId)
          ),
        serviceClient.from('promotions').select('*'),
      ])

    const minOrderSetting = minOrderSettingResult.data
    const productRows = productRowsResult.data
    const productsError = productRowsResult.error

    if (productsError) {
      throw new Error(`Impossible de relire les produits du panier: ${productsError.message}`)
    }

    const checkoutProducts = ((productRows ?? []) as unknown as Array<{
      id: string
      name: string
      unit: string
      base_price: number | string | null
      price_tier_1_qty: number | string | null
      price_tier_1_price: number | string | null
      price_tier_2_qty: number | string | null
      price_tier_2_price: number | string | null
      price_tier_3_qty: number | string | null
      price_tier_3_price: number | string | null
      stock_quantity: number | null
      is_available: boolean | null
    }>)

    const productsById = new Map(
      checkoutProducts.map((row) => [
        row.id,
        {
          id: row.id,
          name: row.name,
          unit: row.unit,
          basePrice: toNumber(row.base_price),
          tier1Qty: toNullableNumber(row.price_tier_1_qty),
          tier1Price: toNullableNumber(row.price_tier_1_price),
          tier2Qty: toNullableNumber(row.price_tier_2_qty),
          tier2Price: toNullableNumber(row.price_tier_2_price),
          tier3Qty: toNullableNumber(row.price_tier_3_qty),
          tier3Price: toNullableNumber(row.price_tier_3_price),
          stockQuantity: row.stock_quantity ?? 0,
          isAvailable: Boolean(row.is_available),
        },
      ])
    )

    const validatedLines = items.map((item) => {
      const product = productsById.get(item.productId)

      if (!product) {
        throw new Error('Un produit du panier nest plus disponible dans la base.')
      }

      if (!product.isAvailable) {
        throw new Error(`Le produit "${product.name}" nest plus disponible actuellement.`)
      }

      if (product.stockQuantity <= 0) {
        throw new Error(`Le produit "${product.name}" nest plus en stock.`)
      }

      if (item.quantity > product.stockQuantity) {
        throw new Error(
          `Le stock visible de "${product.name}" est insuffisant pour la quantite demandee.`
        )
      }

      const unitPrice = getTieredUnitPrice({
        basePrice: product.basePrice,
        quantity: item.quantity,
        tiers: [
          {
            quantity: product.tier1Qty,
            price: product.tier1Price,
          },
          {
            quantity: product.tier2Qty,
            price: product.tier2Price,
          },
          {
            quantity: product.tier3Qty,
            price: product.tier3Price,
          },
        ],
      })

      return {
        productId: product.id,
        productName: product.name,
        productUnit: product.unit,
        quantity: item.quantity,
        unitPrice,
        totalPrice: getLineTotal(unitPrice, item.quantity),
      }
    })

    const subtotal = validatedLines.reduce((total, line) => total + line.totalPrice, 0)
    const globalMinOrderAmount =
      typeof minOrderSetting?.value === 'string' ? Number(minOrderSetting.value) : 0
    const zoneMinOrderAmount = deliveryZoneData
      ? toNumber(deliveryZoneData.min_order_amount)
      : 0
    const requiredMinOrderAmount = Math.max(globalMinOrderAmount, zoneMinOrderAmount)

    if (subtotal < requiredMinOrderAmount) {
      return {
        success: false,
        error: `Le montant minimum pour cette commande est ${requiredMinOrderAmount.toLocaleString('fr-FR')} GNF.`,
      }
    }

    const deliveryFee = deliveryZoneData ? toNumber(deliveryZoneData.delivery_fee) : 0
    const activePromotions = ((promotionsResult.data ?? []) as Promotion[])
      .map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        type: row.type,
        code: row.code,
        value: toNumber(row.value),
        min_order_amount: toNumber(row.min_order_amount),
        max_uses: toNullableNumber(row.max_uses),
        max_uses_per_customer: row.max_uses_per_customer ?? 0,
        current_uses: row.current_uses ?? 0,
        customer_types: Array.isArray(row.customer_types) ? row.customer_types : null,
        customer_levels: Array.isArray(row.customer_levels) ? row.customer_levels : null,
        product_ids: Array.isArray(row.product_ids) ? row.product_ids : null,
        zones: Array.isArray(row.zones) ? row.zones : null,
        is_active: Boolean(row.is_active),
        is_cumulative: Boolean(row.is_cumulative),
        starts_at: row.starts_at,
        ends_at: row.ends_at,
        created_at: row.created_at,
      }))
    const loyaltyPointValue =
      typeof loyaltyPointValueResult.data?.value === 'string'
        ? Number(loyaltyPointValueResult.data.value)
        : 1
    const loyaltyPointsRate =
      typeof loyaltyPointsRateResult.data?.value === 'string'
        ? Number(loyaltyPointsRateResult.data.value)
        : 1
    const financialSummary = getCheckoutFinancialSummary({
      promotions: activePromotions,
      promoCode: input.promoCode ?? null,
      customerType: profileData.customer_type,
      customerLevel: profileData.loyalty_level,
      zoneName: deliveryZoneData?.name ?? null,
      subtotal,
      deliveryFee,
      lines: validatedLines.map((line) => ({
        productId: line.productId,
      })),
      requestedPoints: input.pointsToRedeem ?? 0,
      availablePoints: profileData.loyalty_points ?? 0,
      pointValue: loyaltyPointValue,
      useAccountCredit: Boolean(input.useAccountCredit),
      availableCreditBalance: toNumber(profileData.credit_balance),
    })

    if (financialSummary.error) {
      return {
        success: false,
        error: financialSummary.error,
      }
    }

    const totalAmount = financialSummary.totalAmount
    const finalPaymentMethod = getFinalOrderPaymentMethod({
      selectedPaymentMethod: paymentMethod,
      remainingPaymentAmount: financialSummary.remainingPaymentAmount,
      pointsPaymentAmount: financialSummary.pointsPaymentAmount,
      accountCreditApplied: financialSummary.accountCreditApplied,
    })
    const pointsEarned = getEarnedPoints(totalAmount, loyaltyPointsRate)
    const primaryPromotionId =
      financialSummary.selectedPromotionIds.length === 1
        ? financialSummary.selectedPromotionIds[0]
        : null

    const { data: createdOrder, error: orderError } = await serviceClient
      .from('orders')
      .insert({
        customer_id: user.id,
        status: 'pending',
        delivery_type: deliveryType,
        delivery_address_id: addressData?.id ?? null,
        delivery_zone: deliveryZoneData?.name ?? null,
        delivery_date: deliveryDate,
        delivery_slot: deliveryType === 'delivery' ? deliverySlot : null,
        delivery_instructions: deliveryType === 'delivery' ? deliveryInstructions : null,
        payment_method: finalPaymentMethod,
        payment_status: totalAmount > 0 ? 'pending' : 'paid',
        subtotal,
        discount_amount: financialSummary.discountAmount,
        delivery_fee: deliveryFee,
        total_amount: totalAmount,
        points_used: financialSummary.pointsUsed,
        points_earned: pointsEarned,
        promo_code: financialSummary.selectedPromoCode,
        promo_id: primaryPromotionId,
        customer_notes: customerNotes,
      })
      .select('id, reference, total_amount')
      .single()

    if (orderError || !createdOrder) {
      throw new Error(
        `Impossible de creer la commande principale: ${orderError?.message ?? 'reponse vide'}`
      )
    }

    const { error: itemsError } = await serviceClient.from('order_items').insert(
      validatedLines.map((line) => ({
        order_id: createdOrder.id,
        product_id: line.productId,
        product_name: line.productName,
        product_unit: line.productUnit,
        quantity: line.quantity,
        unit_price: line.unitPrice,
        total_price: line.totalPrice,
      }))
    )

    if (itemsError) {
      await serviceClient.from('orders').delete().eq('id', createdOrder.id)

      return {
        success: false,
        error:
          "La commande n'a pas pu etre finalisee. Aucun debit n'a ete enregistre et vous pouvez reessayer.",
      }
    }

    const paymentTransactionsToInsert = [
      financialSummary.pointsPaymentAmount > 0
        ? {
            order_id: createdOrder.id,
            customer_id: user.id,
            payment_method: 'loyalty_points' as const,
            transaction_type: 'charge' as const,
            status: 'succeeded' as const,
            amount: financialSummary.pointsPaymentAmount,
            currency_code: 'GNF',
            note: `Reglement via points fidelite (${financialSummary.pointsUsed} points).`,
            processed_at: new Date().toISOString(),
          }
        : null,
      financialSummary.accountCreditApplied > 0
        ? {
            order_id: createdOrder.id,
            customer_id: user.id,
            payment_method: 'account_credit' as const,
            transaction_type: 'charge' as const,
            status: 'succeeded' as const,
            amount: financialSummary.accountCreditApplied,
            currency_code: 'GNF',
            note: 'Reglement partiel ou total via credit client.',
            processed_at: new Date().toISOString(),
          }
        : null,
      financialSummary.remainingPaymentAmount > 0
        ? {
            order_id: createdOrder.id,
            customer_id: user.id,
            payment_method: paymentMethod,
            transaction_type: 'charge' as const,
            status: 'pending' as const,
            amount: financialSummary.remainingPaymentAmount,
            currency_code: 'GNF',
            note: 'Transaction initialisee automatiquement au moment du checkout.',
          }
        : null,
    ].filter(Boolean)

    if (paymentTransactionsToInsert.length > 0) {
      const { error: paymentTransactionError } = await serviceClient
        .from('payment_transactions')
        .insert(paymentTransactionsToInsert)

      if (paymentTransactionError) {
        await serviceClient.from('orders').delete().eq('id', createdOrder.id)

        return {
          success: false,
          error:
            isMissingPaymentTransactionsTableError(paymentTransactionError.message)
              ? "La commande n'a pas pu etre finalisee proprement. Appliquez la migration des transactions de paiement puis reessayez."
              : "La commande n'a pas pu etre finalisee proprement. Verifiez la configuration de paiement puis reessayez.",
        }
      }
    }

    const originalCreditBalance = toNumber(profileData.credit_balance)
    const rollbackPromotions = financialSummary.selectedPromotionIds
      .map((promotionId) => activePromotions.find((entry) => entry.id === promotionId) ?? null)
      .filter(Boolean) as Promotion[]
    let hasRedeemedPointsTransaction = false

    if (financialSummary.accountCreditApplied > 0) {
      const nextCreditBalance = Number(
        Math.max(0, originalCreditBalance - financialSummary.accountCreditApplied).toFixed(2)
      )

      const { error: creditBalanceError } = await serviceClient
        .from('customer_profiles')
        .update({
          credit_balance: nextCreditBalance,
        })
        .eq('id', user.id)

      if (creditBalanceError) {
        await cleanupCheckoutFailure({
          supabase: serviceClient,
          orderId: createdOrder.id,
          customerId: user.id,
          restoreCreditBalance: null,
          rollbackPromotions: [],
          deleteRedeemedPointsTransaction: false,
        })

        return {
          success: false,
          error:
            "La commande n'a pas pu etre finalisee car le credit client n'a pas pu etre applique.",
        }
      }
    }

    if (financialSummary.pointsUsed > 0) {
      const nextPointsBalance = Math.max(0, (profileData.loyalty_points ?? 0) - financialSummary.pointsUsed)
      const { error: loyaltyTransactionError } = await serviceClient
        .from('loyalty_transactions')
        .insert({
          customer_id: user.id,
          type: 'redeemed',
          points: -financialSummary.pointsUsed,
          balance_after: nextPointsBalance,
          description: `Points utilises sur la commande ${createdOrder.reference}.`,
          order_id: createdOrder.id,
        })

      if (loyaltyTransactionError) {
        await cleanupCheckoutFailure({
          supabase: serviceClient,
          orderId: createdOrder.id,
          customerId: user.id,
          restoreCreditBalance:
            financialSummary.accountCreditApplied > 0 ? originalCreditBalance : null,
          rollbackPromotions: [],
          deleteRedeemedPointsTransaction: false,
        })

        return {
          success: false,
          error:
            "La commande n'a pas pu etre finalisee car la transaction de fidelite a echoue.",
        }
      }

      hasRedeemedPointsTransaction = true
    }

    if (financialSummary.appliedPromotions.length > 0) {
      const { error: promoUsagesError } = await serviceClient.from('promo_usages').insert(
        financialSummary.appliedPromotions.map((promotion) => ({
          promo_id: promotion.promotionId,
          customer_id: user.id,
          order_id: createdOrder.id,
          discount_applied: promotion.amount,
        }))
      )

      if (promoUsagesError) {
        await cleanupCheckoutFailure({
          supabase: serviceClient,
          orderId: createdOrder.id,
          customerId: user.id,
          restoreCreditBalance:
            financialSummary.accountCreditApplied > 0 ? originalCreditBalance : null,
          rollbackPromotions: [],
          deleteRedeemedPointsTransaction: hasRedeemedPointsTransaction,
        })

        return {
          success: false,
          error:
            "La commande n'a pas pu etre finalisee car l'enregistrement des promotions a echoue.",
        }
      }

      const promotionUpdates = await Promise.all(
        rollbackPromotions.map(async (promotion) => {
          const { error } = await serviceClient
            .from('promotions')
            .update({
              current_uses: promotion.current_uses + 1,
            })
            .eq('id', promotion.id)

          return error
        })
      )

      if (promotionUpdates.some(Boolean)) {
        await cleanupCheckoutFailure({
          supabase: serviceClient,
          orderId: createdOrder.id,
          customerId: user.id,
          restoreCreditBalance:
            financialSummary.accountCreditApplied > 0 ? originalCreditBalance : null,
          rollbackPromotions,
          deleteRedeemedPointsTransaction: hasRedeemedPointsTransaction,
        })

        return {
          success: false,
          error:
            "La commande n'a pas pu etre finalisee car le compteur de promotions n'a pas pu etre synchronise.",
        }
      }
    }

    if (profileData.email) {
      void sendOrderConfirmationNotification({
        customerEmail: profileData.email,
        customerName: profileData.full_name ?? null,
        orderId: createdOrder.id,
        reference: createdOrder.reference,
        totalAmount,
      })
    }

    revalidateCheckoutPaths(createdOrder.id)

    return {
      success: true,
      data: {
        orderId: createdOrder.id,
        reference: createdOrder.reference,
        totalAmount: toNumber(createdOrder.total_amount),
      },
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Impossible de creer la commande pour le moment.",
    }
  }
}
