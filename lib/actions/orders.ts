'use server'

import {
  getCurrentCustomerOrderById,
  getCurrentCustomerOrders,
} from '@/lib/actions/shop'
import {
  getAdminDashboardData,
  getAdminOrderById,
  getAdminOrders,
} from '@/lib/actions/admin-shop'

export async function getCustomerOrders() {
  return getCurrentCustomerOrders()
}

export async function getCustomerOrderById(id: string) {
  return getCurrentCustomerOrderById(id)
}

export async function getOrdersAdminList() {
  return getAdminOrders()
}

export async function getAdminOrderDetailsById(id: string) {
  return getAdminOrderById(id)
}

export async function getOrdersDashboardSnapshot() {
  return getAdminDashboardData()
}
