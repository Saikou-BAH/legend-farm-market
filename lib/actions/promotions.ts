'use server'

import { getAdminPromotionById, getAdminPromotions } from '@/lib/actions/admin-shop'

export async function getPromotionsAdminList() {
  return getAdminPromotions()
}

export async function getPromotionAdminById(id: string) {
  return getAdminPromotionById(id)
}
