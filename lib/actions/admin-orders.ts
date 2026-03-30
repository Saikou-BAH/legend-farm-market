'use server'

import { revalidatePath } from 'next/cache'
import {
  recordAdminActivity,
  requireAdminMutationContext,
} from '@/lib/admin-mutations'
import { sendOrderStatusNotification } from '@/lib/notifications'
import { getOrderStatusLabel } from '@/lib/order-display'
import type {
  ActionResult,
  DeliveryType,
  OrderStatus,
  PaymentMethod,
} from '@/types'

const orderRoles = ['admin', 'manager', 'support', 'logistics'] as const
const orderStatuses: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'returned',
]
const deliveryTypes: DeliveryType[] = ['delivery', 'pickup']
const paymentMethods: PaymentMethod[] = [
  'orange_money',
  'mtn_money',
  'bank_transfer',
  'cash_on_delivery',
  'account_credit',
  'loyalty_points',
]

function normalizeOptionalText(value: string | null | undefined, maxLength: number) {
  const nextValue = value?.trim() ?? ''
  return nextValue ? nextValue.slice(0, maxLength) : null
}

function isOrderStatus(value: string): value is OrderStatus {
  return orderStatuses.includes(value as OrderStatus)
}

function isDeliveryType(value: string): value is DeliveryType {
  return deliveryTypes.includes(value as DeliveryType)
}

function isPaymentMethod(value: string): value is PaymentMethod {
  return paymentMethods.includes(value as PaymentMethod)
}

function revalidateAdminOrderPaths(orderId: string) {
  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath('/account/orders')
  revalidatePath(`/account/orders/${orderId}`)
  revalidatePath(`/track/${orderId}`)
  revalidatePath(`/order-confirmation/${orderId}`)
}

export async function updateAdminOrder(input: {
  id: string
  status: string
  deliveryType: string
  deliveryZone: string | null
  deliveryDate: string | null
  deliverySlot: string | null
  deliveryInstructions: string | null
  paymentMethod: string | null
  adminNotes: string | null
  cancellationReason: string | null
  deliveryFee?: string | number | null
  adminDiscount?: string | number | null
}): Promise<ActionResult<{ id: string; totalAmount: number }>> {
  try {
    const context = await requireAdminMutationContext([...orderRoles])

    if (!context.ok) {
      return {
        success: false,
        error: context.error,
      }
    }

    const id = input.id.trim()

    if (!id) {
      return {
        success: false,
        error: 'La commande cible est invalide.',
      }
    }

    if (!isOrderStatus(input.status)) {
      return {
        success: false,
        error: 'Le statut de commande est invalide.',
      }
    }

    if (!isDeliveryType(input.deliveryType)) {
      return {
        success: false,
        error: 'Le type de livraison est invalide.',
      }
    }

    if (input.paymentMethod && !isPaymentMethod(input.paymentMethod)) {
      return {
        success: false,
        error: 'Le moyen de paiement est invalide.',
      }
    }

    const deliveryFee =
      input.deliveryFee != null && input.deliveryFee !== ''
        ? Math.max(0, Number(input.deliveryFee))
        : null

    const adminDiscount =
      input.adminDiscount != null && input.adminDiscount !== ''
        ? Math.max(0, Number(input.adminDiscount))
        : null

    if (deliveryFee !== null && !Number.isFinite(deliveryFee)) {
      return { success: false, error: 'Le frais de livraison est invalide.' }
    }
    if (adminDiscount !== null && !Number.isFinite(adminDiscount)) {
      return { success: false, error: 'La réduction admin est invalide.' }
    }

    const { data: existingOrder, error: existingOrderError } = await context.supabase
      .from('orders')
      .select('id, status, delivered_at, cancelled_at, reference, customer_id, points_earned, subtotal, discount_amount, delivery_fee, admin_discount')
      .eq('id', id)
      .maybeSingle()

    if (existingOrderError || !existingOrder) {
      throw new Error(
        `Impossible de charger la commande cible: ${existingOrderError?.message ?? 'introuvable'}`
      )
    }

    const cancellationReason = normalizeOptionalText(input.cancellationReason, 500)

    if (input.status === 'cancelled' && !cancellationReason) {
      return {
        success: false,
        error: "Un motif d'annulation est requis pour passer la commande en annulee.",
      }
    }

    const now = new Date().toISOString()

    // Recalcul du total si les financiers changent
    const nextDeliveryFee = deliveryFee ?? Number(existingOrder.delivery_fee ?? 0)
    const nextAdminDiscount = adminDiscount ?? Number(existingOrder.admin_discount ?? 0)
    const subtotal = Number(existingOrder.subtotal ?? 0)
    const discountAmount = Number(existingOrder.discount_amount ?? 0)
    const nextTotal = Math.max(0, subtotal - discountAmount - nextAdminDiscount + nextDeliveryFee)

    const { data: updatedOrder, error } = await context.supabase
      .from('orders')
      .update({
        status: input.status,
        delivery_type: input.deliveryType,
        delivery_zone: normalizeOptionalText(input.deliveryZone, 80),
        delivery_date: input.deliveryDate?.trim() ? input.deliveryDate : null,
        delivery_slot: normalizeOptionalText(input.deliverySlot, 80),
        delivery_instructions: normalizeOptionalText(input.deliveryInstructions, 500),
        payment_method: input.paymentMethod?.trim() ? input.paymentMethod : null,
        admin_notes: normalizeOptionalText(input.adminNotes, 2000),
        cancellation_reason: input.status === 'cancelled' ? cancellationReason : null,
        cancelled_at: input.status === 'cancelled' ? existingOrder.cancelled_at ?? now : null,
        delivered_at: input.status === 'delivered' ? existingOrder.delivered_at ?? now : null,
        delivery_fee: nextDeliveryFee,
        admin_discount: nextAdminDiscount,
        total_amount: nextTotal,
      })
      .eq('id', id)
      .select('total_amount')
      .single()

    if (error) {
      throw new Error(`Impossible de mettre a jour la commande: ${error.message}`)
    }

    await recordAdminActivity({
      supabase: context.supabase,
      staffId: context.staff.id,
      action: 'order.updated',
      entityType: 'order',
      entityId: id,
      summary: `Commande ${existingOrder.reference} mise a jour`,
      metadata: {
        previous_status: existingOrder.status,
        next_status: input.status,
        delivery_type: input.deliveryType,
        payment_method: input.paymentMethod?.trim() || null,
      },
    })

    if (
      existingOrder.customer_id &&
      existingOrder.status !== 'delivered' &&
      input.status === 'delivered' &&
      (existingOrder.points_earned ?? 0) > 0
    ) {
      const { data: existingReward } = await context.supabase
        .from('loyalty_transactions')
        .select('id')
        .eq('order_id', id)
        .eq('customer_id', existingOrder.customer_id)
        .eq('type', 'earned_purchase')
        .maybeSingle()

      if (!existingReward) {
        const { data: customerProfile } = await context.supabase
          .from('customer_profiles')
          .select('loyalty_points')
          .eq('id', existingOrder.customer_id)
          .maybeSingle()

        const currentBalance = customerProfile?.loyalty_points ?? 0

        await context.supabase.from('loyalty_transactions').insert({
          customer_id: existingOrder.customer_id,
          type: 'earned_purchase',
          points: existingOrder.points_earned,
          balance_after: currentBalance + existingOrder.points_earned,
          description: `Points credites apres livraison de la commande ${existingOrder.reference}.`,
          order_id: id,
        })
      }
    }

    if (existingOrder.customer_id && existingOrder.status !== input.status) {
      const { data: customerProfile } = await context.supabase
        .from('customer_profiles')
        .select('full_name, email')
        .eq('id', existingOrder.customer_id)
        .maybeSingle()

      if (customerProfile?.email) {
        void sendOrderStatusNotification({
          customerEmail: customerProfile.email,
          customerName: customerProfile.full_name ?? null,
          orderId: id,
          reference: existingOrder.reference,
          statusLabel: getOrderStatusLabel(input.status),
        })
      }
    }

    revalidateAdminOrderPaths(id)

    return {
      success: true,
      data: {
        id,
        totalAmount: Number(updatedOrder?.total_amount ?? nextTotal),
      },
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Impossible de mettre a jour la commande.',
    }
  }
}
