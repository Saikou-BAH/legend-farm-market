'use server'

import { getPublicDeliveryZones } from '@/lib/actions/shop'
import { getAdminDeliveryZones } from '@/lib/actions/admin-shop'

export async function getDeliveryZonesAdminList() {
  return getAdminDeliveryZones()
}

export async function getPublicDeliveryZonesList() {
  return getPublicDeliveryZones()
}
