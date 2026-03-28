'use server'

import { revalidatePath } from 'next/cache'
import {
  recordAdminActivity,
  requireAdminMutationContext,
} from '@/lib/admin-mutations'
import type { ActionResult, CustomerType } from '@/types'

const customerRoles = ['admin', 'manager', 'support'] as const
const customerTypes: CustomerType[] = [
  'individual',
  'retailer',
  'restaurant',
  'wholesaler',
  'hotel',
]

function normalizeRequiredText(
  value: string | null | undefined,
  label: string,
  maxLength: number
) {
  const nextValue = value?.trim() ?? ''

  if (!nextValue) {
    throw new Error(`${label} est obligatoire.`)
  }

  return nextValue.slice(0, maxLength)
}

function normalizeOptionalText(value: string | null | undefined, maxLength: number) {
  const nextValue = value?.trim() ?? ''
  return nextValue ? nextValue.slice(0, maxLength) : null
}

function parseMoney(value: string | number | null | undefined, label: string) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} est invalide.`)
  }

  return Number(parsed.toFixed(2))
}

export async function getAdminCustomerOrders(customerId: string): Promise<
  ActionResult<Array<{
    id: string
    reference: string
    status: string
    payment_status: string
    total_amount: number
    delivery_type: string
    created_at: string
    items_count: number
  }>>
> {
  try {
    const context = await requireAdminMutationContext(['admin', 'manager', 'support', 'logistics'])

    if (!context.ok) {
      return { success: false, error: context.error }
    }

    const id = customerId.trim()
    if (!id) return { success: false, error: 'Client invalide.' }

    const { data: orders, error: ordersError } = await context.supabase
      .from('orders')
      .select('id, reference, status, payment_status, total_amount, delivery_type, created_at')
      .eq('customer_id', id)
      .order('created_at', { ascending: false })

    if (ordersError) {
      throw new Error(`Impossible de lire les commandes: ${ordersError.message}`)
    }

    const orderIds = (orders ?? []).map((o: any) => o.id)

    let itemsCounts: Record<string, number> = {}
    if (orderIds.length > 0) {
      const { data: items } = await context.supabase
        .from('order_items')
        .select('order_id')
        .in('order_id', orderIds)

      for (const item of items ?? []) {
        itemsCounts[item.order_id] = (itemsCounts[item.order_id] ?? 0) + 1
      }
    }

    return {
      success: true,
      data: (orders ?? []).map((o: any) => ({
        id: o.id,
        reference: o.reference,
        status: o.status,
        payment_status: o.payment_status,
        total_amount: Number(o.total_amount),
        delivery_type: o.delivery_type,
        created_at: o.created_at,
        items_count: itemsCounts[o.id] ?? 0,
      })),
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Impossible de lire les commandes.',
    }
  }
}

export async function createAdminProspect(input: {
  fullName: string
  email: string | null
  phone: string | null
  customerType: CustomerType
  notes: string | null
}): Promise<ActionResult<{ id: string }>> {
  try {
    const context = await requireAdminMutationContext(['admin', 'manager', 'support'])

    if (!context.ok) {
      return { success: false, error: context.error }
    }

    const fullName = input.fullName?.trim()
    if (!fullName) return { success: false, error: 'Le nom complet est obligatoire.' }

    const email = input.email?.trim() || null
    const phone = input.phone?.trim() || null
    const notes = input.notes?.trim() || null

    if (!customerTypes.includes(input.customerType)) {
      return { success: false, error: 'Le type de client est invalide.' }
    }

    if (email) {
      const { data: existing } = await context.supabase
        .from('customer_profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      if (existing) {
        return { success: false, error: 'Un client avec cet email existe deja.' }
      }
    }

    const prospectId = crypto.randomUUID()

    const { error } = await context.supabase
      .from('customer_profiles')
      .insert({
        id: prospectId,
        full_name: fullName.slice(0, 120),
        email: email ?? `prospect-${prospectId.slice(0, 8)}@legendfarm.internal`,
        phone: phone ? phone.slice(0, 40) : null,
        customer_type: input.customerType,
        notes: notes ? `[PROSPECT] ${notes}`.slice(0, 2000) : '[PROSPECT] Cree manuellement depuis l admin.',
        loyalty_points: 0,
        loyalty_level: 'bronze',
        credit_balance: 0,
        credit_limit: 0,
        is_blacklisted: false,
      })

    if (error) {
      throw new Error(`Impossible de creer le prospect: ${error.message}`)
    }

    await recordAdminActivity({
      supabase: context.supabase,
      staffId: context.staff.id,
      action: 'customer.prospect_created',
      entityType: 'customer',
      entityId: prospectId,
      summary: `Prospect cree manuellement: ${fullName}`,
      metadata: { customer_type: input.customerType, has_email: !!email, has_phone: !!phone },
    })

    revalidatePath('/admin/customers')

    return { success: true, data: { id: prospectId } }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Impossible de creer le prospect.',
    }
  }
}

export async function updateAdminCustomer(input: {
  id: string
  fullName: string
  phone: string | null
  customerType: CustomerType
  creditBalance: string | number
  creditLimit: string | number
  isBlacklisted: boolean
  notes: string | null
}): Promise<ActionResult<{ id: string }>> {
  try {
    const context = await requireAdminMutationContext([...customerRoles])

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
        error: 'Le client cible est invalide.',
      }
    }

    if (!customerTypes.includes(input.customerType)) {
      return {
        success: false,
        error: 'Le type de client est invalide.',
      }
    }

    const payload = {
      full_name: normalizeRequiredText(input.fullName, 'Le nom complet', 120),
      phone: normalizeOptionalText(input.phone, 40),
      customer_type: input.customerType,
      credit_balance: parseMoney(input.creditBalance, 'Le solde credit'),
      credit_limit: parseMoney(input.creditLimit, 'Le plafond credit'),
      is_blacklisted: input.isBlacklisted,
      notes: normalizeOptionalText(input.notes, 2000),
    }

    const { error } = await context.supabase
      .from('customer_profiles')
      .update(payload)
      .eq('id', id)

    if (error) {
      throw new Error(`Impossible de mettre a jour le client: ${error.message}`)
    }

    await recordAdminActivity({
      supabase: context.supabase,
      staffId: context.staff.id,
      action: 'customer.updated',
      entityType: 'customer',
      entityId: id,
      summary: `Client mis a jour: ${payload.full_name}`,
      metadata: {
        customer_type: payload.customer_type,
        is_blacklisted: payload.is_blacklisted,
      },
    })

    revalidatePath('/admin/customers')
    revalidatePath(`/admin/customers/${id}`)
    revalidatePath('/account/dashboard')
    revalidatePath('/account/profile')

    return {
      success: true,
      data: {
        id,
      },
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Impossible de mettre a jour le client.',
    }
  }
}
