'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentCustomerAccount } from '@/lib/actions/shop'
import {
  getAdminCustomerById,
  getAdminCustomers,
} from '@/lib/actions/admin-shop'
import { env } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'

export async function getCustomerAccount() {
  return getCurrentCustomerAccount()
}

export async function getCustomerProfileById(id: string) {
  return getAdminCustomerById(id)
}

export async function getCustomersAdminList() {
  return getAdminCustomers()
}

function normalizeOptionalText(value: string | null | undefined, maxLength: number) {
  const nextValue = value?.trim() ?? ''

  if (!nextValue) {
    return null
  }

  return nextValue.slice(0, maxLength)
}

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

async function getAuthenticatedCustomer() {
  if (!env.hasSupabase()) {
    return {
      isConfigured: false,
      userId: null as string | null,
      supabase: null,
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return {
    isConfigured: true,
    userId: user?.id ?? null,
    supabase,
  }
}

function revalidateCustomerAccountPaths() {
  revalidatePath('/account/dashboard')
  revalidatePath('/account/profile')
  revalidatePath('/account/addresses')
  revalidatePath('/checkout')
}

export async function updateCurrentCustomerProfile(input: {
  fullName: string
  phone: string | null
}): Promise<ActionResult<{ fullName: string; phone: string | null }>> {
  try {
    const { isConfigured, supabase, userId } = await getAuthenticatedCustomer()

    if (!isConfigured || !supabase) {
      return {
        success: false,
        error: "Supabase n'est pas encore configure.",
      }
    }

    if (!userId) {
      return {
        success: false,
        error: 'Vous devez etre connecte pour modifier votre profil.',
      }
    }

    const fullName = normalizeRequiredText(input.fullName, 'Le nom complet', 120)
    const phone = normalizeOptionalText(input.phone, 40)

    const { error } = await supabase
      .from('customer_profiles')
      .update({
        full_name: fullName,
        phone,
      })
      .eq('id', userId)

    if (error) {
      throw new Error(`Impossible de mettre a jour le profil: ${error.message}`)
    }

    revalidateCustomerAccountPaths()

    return {
      success: true,
      data: {
        fullName,
        phone,
      },
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Impossible de mettre a jour le profil client.',
    }
  }
}

export async function createCustomerAddress(input: {
  label: string | null
  fullAddress: string
  city: string
  zone: string
  phone: string | null
  isDefault: boolean
}): Promise<ActionResult<{ created: true }>> {
  try {
    const { isConfigured, supabase, userId } = await getAuthenticatedCustomer()

    if (!isConfigured || !supabase) {
      return {
        success: false,
        error: "Supabase n'est pas encore configure.",
      }
    }

    if (!userId) {
      return {
        success: false,
        error: 'Vous devez etre connecte pour ajouter une adresse.',
      }
    }

    const label = normalizeOptionalText(input.label, 60)
    const fullAddress = normalizeRequiredText(input.fullAddress, "L'adresse complete", 220)
    const city = normalizeRequiredText(input.city, 'La ville', 80)
    const zone = normalizeRequiredText(input.zone, 'La zone', 80)
    const phone = normalizeOptionalText(input.phone, 40)

    const { error } = await supabase.from('customer_addresses').insert({
      customer_id: userId,
      label,
      full_address: fullAddress,
      city,
      zone,
      phone,
      is_default: input.isDefault,
    })

    if (error) {
      throw new Error(`Impossible d'ajouter l'adresse: ${error.message}`)
    }

    revalidateCustomerAccountPaths()

    return {
      success: true,
      data: {
        created: true,
      },
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Impossible d'ajouter l'adresse client.",
    }
  }
}

export async function updateCustomerAddress(input: {
  id: string
  label: string | null
  fullAddress: string
  city: string
  zone: string
  phone: string | null
  isDefault: boolean
}): Promise<ActionResult<{ updated: true }>> {
  try {
    const { isConfigured, supabase, userId } = await getAuthenticatedCustomer()

    if (!isConfigured || !supabase) {
      return {
        success: false,
        error: "Supabase n'est pas encore configure.",
      }
    }

    if (!userId) {
      return {
        success: false,
        error: 'Vous devez etre connecte pour modifier une adresse.',
      }
    }

    const id = input.id.trim()

    if (!id) {
      return {
        success: false,
        error: "L'adresse cible est invalide.",
      }
    }

    const label = normalizeOptionalText(input.label, 60)
    const fullAddress = normalizeRequiredText(input.fullAddress, "L'adresse complete", 220)
    const city = normalizeRequiredText(input.city, 'La ville', 80)
    const zone = normalizeRequiredText(input.zone, 'La zone', 80)
    const phone = normalizeOptionalText(input.phone, 40)

    const { error } = await supabase
      .from('customer_addresses')
      .update({
        label,
        full_address: fullAddress,
        city,
        zone,
        phone,
        is_default: input.isDefault,
      })
      .eq('id', id)
      .eq('customer_id', userId)

    if (error) {
      throw new Error(`Impossible de modifier l'adresse: ${error.message}`)
    }

    revalidateCustomerAccountPaths()

    return {
      success: true,
      data: {
        updated: true,
      },
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Impossible de modifier l'adresse client.",
    }
  }
}

export async function deleteCustomerAddress(addressId: string): Promise<ActionResult<{ deleted: true }>> {
  try {
    const { isConfigured, supabase, userId } = await getAuthenticatedCustomer()

    if (!isConfigured || !supabase) {
      return {
        success: false,
        error: "Supabase n'est pas encore configure.",
      }
    }

    if (!userId) {
      return {
        success: false,
        error: 'Vous devez etre connecte pour supprimer une adresse.',
      }
    }

    const id = addressId.trim()

    if (!id) {
      return {
        success: false,
        error: "L'adresse cible est invalide.",
      }
    }

    const { error } = await supabase
      .from('customer_addresses')
      .delete()
      .eq('id', id)
      .eq('customer_id', userId)

    if (error) {
      throw new Error(`Impossible de supprimer l'adresse: ${error.message}`)
    }

    revalidateCustomerAccountPaths()

    return {
      success: true,
      data: {
        deleted: true,
      },
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Impossible de supprimer l'adresse client.",
    }
  }
}

export async function setDefaultCustomerAddress(addressId: string): Promise<ActionResult<{ updated: true }>> {
  try {
    const { isConfigured, supabase, userId } = await getAuthenticatedCustomer()

    if (!isConfigured || !supabase) {
      return {
        success: false,
        error: "Supabase n'est pas encore configure.",
      }
    }

    if (!userId) {
      return {
        success: false,
        error: 'Vous devez etre connecte pour modifier vos adresses.',
      }
    }

    const id = addressId.trim()

    if (!id) {
      return {
        success: false,
        error: "L'adresse cible est invalide.",
      }
    }

    const { error } = await supabase
      .from('customer_addresses')
      .update({ is_default: true })
      .eq('id', id)
      .eq('customer_id', userId)

    if (error) {
      throw new Error(`Impossible de definir l'adresse par defaut: ${error.message}`)
    }

    revalidateCustomerAccountPaths()

    return {
      success: true,
      data: {
        updated: true,
      },
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Impossible de definir l'adresse par defaut.",
    }
  }
}
