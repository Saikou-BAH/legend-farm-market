'use server'

import { revalidatePath } from 'next/cache'
import { env } from '@/lib/env'
import { createServiceClient } from '@/lib/supabase/server'
import { getTieredUnitPrice, getLineTotal } from '@/lib/utils/price'
import type { ActionResult } from '@/types'

export interface GuestCheckoutInput {
  guestName: string
  guestPhone: string
  deliveryType: 'delivery' | 'pickup'
  deliveryAddress: string | null
  deliveryDate: string | null
  customerNotes: string | null
  paymentMethod: 'cash_on_delivery' | 'orange_money' | 'mtn_money'
  items: Array<{ productId: string; quantity: number }>
}

export async function createGuestCheckoutOrder(
  input: GuestCheckoutInput
): Promise<ActionResult<{ orderId: string; reference: string; totalAmount: number }>> {
  try {
    if (!env.hasSupabase() || !env.hasServiceRole()) {
      return {
        success: false,
        error: "La configuration serveur est incomplète. Contactez Legend Farm.",
      }
    }

    const guestName = input.guestName?.trim()
    const guestPhone = input.guestPhone?.trim()

    if (!guestName || guestName.length < 2) {
      return { success: false, error: 'Votre nom est obligatoire.' }
    }

    if (!guestPhone || guestPhone.length < 8) {
      return { success: false, error: 'Un numéro de téléphone valide est obligatoire.' }
    }

    if (!input.items || input.items.length === 0) {
      return { success: false, error: 'Le panier est vide.' }
    }

    if (input.deliveryType === 'delivery' && !input.deliveryAddress?.trim()) {
      return { success: false, error: "L'adresse de livraison est obligatoire." }
    }

    const supabase = await createServiceClient()

    // Fetch and validate products
    const productIds = [...new Set(input.items.map((i) => i.productId))]
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, unit, base_price, stock_quantity, availability_status, price_tier_1_qty, price_tier_1_price, price_tier_2_qty, price_tier_2_price, price_tier_3_qty, price_tier_3_price')
      .in('id', productIds)
      .eq('is_available', true)
      .neq('availability_status', 'unavailable')

    if (productsError) {
      throw new Error(`Impossible de vérifier les produits : ${productsError.message}`)
    }

    const productMap = new Map((products ?? []).map((p) => [p.id, p]))

    const validatedLines: Array<{
      productId: string
      productName: string
      productUnit: string
      quantity: number
      unitPrice: number
      totalPrice: number
    }> = []

    for (const item of input.items) {
      const product = productMap.get(item.productId)
      if (!product) {
        return {
          success: false,
          error: `Le produit commandé n'est plus disponible.`,
        }
      }

      const quantity = Number(item.quantity)
      if (!Number.isInteger(quantity) || quantity <= 0) {
        return { success: false, error: 'Une quantité dans le panier est invalide.' }
      }

      if (product.stock_quantity < quantity) {
        return {
          success: false,
          error: `Stock insuffisant pour "${product.name}" (disponible : ${product.stock_quantity}).`,
        }
      }

      const unitPrice = getTieredUnitPrice({
        basePrice: Number(product.base_price),
        quantity,
        tiers: [
          { quantity: product.price_tier_1_qty, price: product.price_tier_1_price },
          { quantity: product.price_tier_2_qty, price: product.price_tier_2_price },
          { quantity: product.price_tier_3_qty, price: product.price_tier_3_price },
        ],
      })
      const totalPrice = getLineTotal(unitPrice, quantity)

      validatedLines.push({
        productId: product.id,
        productName: product.name,
        productUnit: product.unit,
        quantity,
        unitPrice,
        totalPrice,
      })
    }

    const subtotal = validatedLines.reduce((sum, l) => sum + l.totalPrice, 0)
    const totalAmount = subtotal // No delivery fee for guest (pickup assumed, or TBD)

    if (totalAmount <= 0) {
      return { success: false, error: 'Le total de la commande est invalide.' }
    }

    const { data: createdOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: null,
        guest_name: guestName.slice(0, 120),
        guest_phone: guestPhone.slice(0, 30),
        status: 'pending',
        delivery_type: input.deliveryType,
        delivery_zone: input.deliveryAddress?.trim().slice(0, 300) ?? null,
        delivery_date: input.deliveryDate ?? null,
        delivery_instructions: null,
        payment_method: input.paymentMethod,
        payment_status: 'pending',
        subtotal,
        discount_amount: 0,
        delivery_fee: 0,
        total_amount: totalAmount,
        points_used: 0,
        points_earned: 0,
        customer_notes: input.customerNotes?.trim().slice(0, 1200) ?? null,
      })
      .select('id, reference, total_amount')
      .single()

    if (orderError || !createdOrder) {
      throw new Error(
        `Impossible de créer la commande : ${orderError?.message ?? 'réponse vide'}`
      )
    }

    const { error: itemsError } = await supabase.from('order_items').insert(
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
      await supabase.from('orders').delete().eq('id', createdOrder.id)
      return {
        success: false,
        error: "La commande n'a pas pu être finalisée. Veuillez réessayer.",
      }
    }

    revalidatePath('/admin/orders')
    revalidatePath('/admin/dashboard')

    return {
      success: true,
      data: {
        orderId: createdOrder.id,
        reference: createdOrder.reference ?? createdOrder.id,
        totalAmount: Number(createdOrder.total_amount),
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Impossible de passer la commande.',
    }
  }
}
