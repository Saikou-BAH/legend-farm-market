'use server'

import { getCurrentCustomerAccount } from '@/lib/actions/shop'
import { getAdminCustomers } from '@/lib/actions/admin-shop'

export async function getCustomerAccount() {
  return getCurrentCustomerAccount()
}

export async function getCustomerProfileById(id: string) {
  const { access, customers } = await getAdminCustomers()

  return {
    access,
    customer: customers.find((customer) => customer.id === id) ?? null,
  }
}

export async function getCustomersAdminList() {
  return getAdminCustomers()
}
