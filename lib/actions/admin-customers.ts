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
