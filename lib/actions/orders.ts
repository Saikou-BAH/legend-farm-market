'use server'

import { getCurrentCustomerOrders } from '@/lib/actions/shop'
import { getAdminDashboardData, getAdminOrders } from '@/lib/actions/admin-shop'

export async function getCustomerOrders() {
  return getCurrentCustomerOrders()
}

export async function getCustomerOrderById(id: string) {
  const { isAuthenticated, isConfigured, orders } = await getCurrentCustomerOrders()

  return {
    isConfigured,
    isAuthenticated,
    order: orders.find((order) => order.id === id) ?? null,
  }
}

export async function getOrdersAdminList() {
  return getAdminOrders()
}

export async function getOrdersDashboardSnapshot() {
  return getAdminDashboardData()
}
