'use server'

import { getCurrentCustomerAccount } from '@/lib/actions/shop'
import { getAdminSettings } from '@/lib/actions/admin-shop'

export async function getCustomerLoyaltySnapshot() {
  const { profile, ...rest } = await getCurrentCustomerAccount()

  return {
    ...rest,
    profile,
  }
}

export async function getAdminLoyaltySettings() {
  return getAdminSettings()
}
