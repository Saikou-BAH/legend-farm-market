'use server'

import { getAdminDeliveryZones } from '@/lib/actions/admin-shop'

export async function getDeliveryZonesAdminList() {
  return getAdminDeliveryZones()
}
