'use server'

import { getAdminPromotions } from '@/lib/actions/admin-shop'

export async function getPromotionsAdminList() {
  return getAdminPromotions()
}
