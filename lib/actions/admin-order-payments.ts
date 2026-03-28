'use server'

import { revalidatePath } from 'next/cache'
import { recordAdminActivity } from '@/lib/admin-mutations'
import { getNetPaidAmount } from '@/lib/payment-transactions'
import { env } from '@/lib/env'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type {
  ActionResult,
  PaymentMethod,
  PaymentTransaction,
  PaymentTransactionStatus,
  PaymentTransactionType,
  StaffProfile,
} from '@/types'

const supportedPaymentMethods = new Set<PaymentMethod>([
  'orange_money',
  'mtn_money',
  'bank_transfer',
  'cash_on_delivery',
  'account_credit',
  'loyalty_points',
])

const supportedTransactionTypes = new Set<PaymentTransactionType>(['charge', 'refund'])
const supportedTransactionStatuses = new Set<PaymentTransactionStatus>([
  'pending',
  'succeeded',
  'failed',
  'cancelled',
])

interface AdminOrderPaymentAccess {
  status:
    | 'misconfigured'
    | 'missing_service_role'
    | 'unauthenticated'
    | 'forbidden'
    | 'ready'
  staff: StaffProfile | null
}

interface RecordAdminOrderPaymentInput {
  orderId: string
  amount: number
  paymentMethod: PaymentMethod
  transactionType: PaymentTransactionType
  status: PaymentTransactionStatus
  provider: string | null
  providerReference: string | null
  note: string | null
}

function normalizeOptionalText(value: string | null | undefined, maxLength: number) {
  const nextValue = value?.trim() ?? ''

  if (!nextValue) {
    return null
  }

  return nextValue.slice(0, maxLength)
}

function toNumber(value: number | string | null | undefined) {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string' && value.trim() !== '') {
    return Number(value)
  }

  return 0
}

function mapPaymentTransaction(row: any): PaymentTransaction {
  return {
    id: row.id,
    order_id: row.order_id,
    customer_id: row.customer_id,
    payment_method: row.payment_method,
    transaction_type: row.transaction_type,
    status: row.status,
    amount: toNumber(row.amount),
    currency_code: row.currency_code,
    provider: row.provider,
    provider_reference: row.provider_reference,
    note: row.note,
    created_by_staff_id: row.created_by_staff_id,
    created_by_staff_name: null,
    processed_at: row.processed_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

async function getAdminOrderPaymentAccess(): Promise<AdminOrderPaymentAccess> {
  if (!env.hasSupabase()) {
    return {
      status: 'misconfigured',
      staff: null,
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      status: 'unauthenticated',
      staff: null,
    }
  }

  const { data } = await supabase
    .from('staff_profiles')
    .select('id, full_name, email, phone, role, is_active, created_at, updated_at')
    .eq('id', user.id)
    .maybeSingle()

  if (!data || !data.is_active) {
    return {
      status: 'forbidden',
      staff: null,
    }
  }

  return {
    status: env.hasServiceRole() ? 'ready' : 'missing_service_role',
    staff: data as StaffProfile,
  }
}

function revalidateOrderPaymentPaths(orderId: string) {
  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath('/account/orders')
  revalidatePath(`/account/orders/${orderId}`)
  revalidatePath(`/order-confirmation/${orderId}`)
  revalidatePath(`/track/${orderId}`)
}

export async function recordAdminOrderPaymentTransaction(
  input: RecordAdminOrderPaymentInput
): Promise<ActionResult<{ orderId: string }>> {
  try {
    const access = await getAdminOrderPaymentAccess()

    if (access.status !== 'ready' || !access.staff) {
      return {
        success: false,
        error: "Acces admin insuffisant pour enregistrer une transaction de paiement.",
      }
    }

    if (!input.orderId.trim()) {
      return {
        success: false,
        error: 'La commande cible est invalide.',
      }
    }

    if (!supportedPaymentMethods.has(input.paymentMethod)) {
      return {
        success: false,
        error: 'Le mode de paiement choisi est invalide.',
      }
    }

    if (!supportedTransactionTypes.has(input.transactionType)) {
      return {
        success: false,
        error: 'Le type de transaction est invalide.',
      }
    }

    if (!supportedTransactionStatuses.has(input.status)) {
      return {
        success: false,
        error: 'Le statut transactionnel choisi est invalide.',
      }
    }

    const amount = Number(input.amount)

    if (!Number.isFinite(amount) || amount <= 0) {
      return {
        success: false,
        error: 'Le montant doit etre strictement positif.',
      }
    }

    const provider = normalizeOptionalText(input.provider, 80)
    const providerReference = normalizeOptionalText(input.providerReference, 120)
    const note = normalizeOptionalText(input.note, 1200)

    const supabase = await createServiceClient()
    const [{ data: orderData, error: orderError }, { data: transactionRows, error: txError }] =
      await Promise.all([
        supabase
          .from('orders')
          .select('id, total_amount, payment_method, customer_id, status')
          .eq('id', input.orderId)
          .maybeSingle(),
        supabase
          .from('payment_transactions')
          .select('*')
          .eq('order_id', input.orderId),
      ])

    if (orderError) {
      throw new Error(`Impossible de charger la commande: ${orderError.message}`)
    }

    if (txError) {
      throw new Error(
        `Impossible de charger l'historique de paiement. Verifiez la migration payment_transactions.`
      )
    }

    if (!orderData) {
      return {
        success: false,
        error: 'La commande cible est introuvable.',
      }
    }

    const orderTotal = toNumber(orderData.total_amount)
    const existingTransactions = (transactionRows ?? []).map(mapPaymentTransaction)
    const currentNetPaid = getNetPaidAmount(existingTransactions)

    if (
      input.transactionType === 'charge' &&
      input.status === 'succeeded' &&
      (orderData.status === 'cancelled' || orderData.status === 'returned')
    ) {
      return {
        success: false,
        error:
          'Impossible d enregistrer un paiement reussi sur une commande annulee ou retournee.',
      }
    }

    if (input.status === 'succeeded' && input.transactionType === 'charge') {
      if (currentNetPaid + amount > orderTotal) {
        return {
          success: false,
          error:
            'Ce paiement depasserait le montant total de la commande. Utilisez un montant partiel plus faible.',
        }
      }
    }

    if (input.status === 'succeeded' && input.transactionType === 'refund') {
      if (currentNetPaid <= 0) {
        return {
          success: false,
          error: 'Aucun montant effectivement encaisse nest disponible pour un remboursement.',
        }
      }

      if (amount > currentNetPaid) {
        return {
          success: false,
          error:
            'Le remboursement saisi depasse le montant net actuellement encaisse pour cette commande.',
        }
      }
    }

    const { error: insertError } = await supabase.from('payment_transactions').insert({
      order_id: input.orderId,
      customer_id: orderData.customer_id,
      payment_method: input.paymentMethod,
      transaction_type: input.transactionType,
      status: input.status,
      amount,
      currency_code: 'GNF',
      provider,
      provider_reference: providerReference,
      note,
      created_by_staff_id: access.staff.id,
      processed_at: input.status === 'succeeded' ? new Date().toISOString() : null,
    })

    if (insertError) {
      throw new Error(`Impossible d'enregistrer la transaction: ${insertError.message}`)
    }

    await recordAdminActivity({
      supabase,
      staffId: access.staff.id,
      action: 'payment.recorded',
      entityType: 'order',
      entityId: input.orderId,
      summary: `Transaction ${input.transactionType} ${input.status} enregistree`,
      metadata: {
        amount,
        payment_method: input.paymentMethod,
        transaction_type: input.transactionType,
        status: input.status,
      },
    })

    revalidateOrderPaymentPaths(input.orderId)

    return {
      success: true,
      data: {
        orderId: input.orderId,
      },
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Impossible d'enregistrer la transaction de paiement.",
    }
  }
}
