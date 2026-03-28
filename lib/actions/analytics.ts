'use server'

import { env } from '@/lib/env'
import { createClient, createServiceClient } from '@/lib/supabase/server'

function toNumber(value: number | string | null | undefined) {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string' && value.trim() !== '') {
    return Number(value)
  }

  return 0
}

async function getAnalyticsAccess() {
  if (!env.hasSupabase()) {
    return { status: 'misconfigured' as const }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { status: 'unauthenticated' as const }
  }

  const { data } = await supabase
    .from('staff_profiles')
    .select('id, is_active')
    .eq('id', user.id)
    .maybeSingle()

  if (!data?.is_active) {
    return { status: 'forbidden' as const }
  }

  if (!env.hasServiceRole()) {
    return { status: 'missing_service_role' as const }
  }

  return { status: 'ready' as const }
}

export async function getAnalyticsOverview() {
  const access = await getAnalyticsAccess()

  if (access.status !== 'ready') {
    return {
      access,
      totals: {
        revenue: 0,
        orders: 0,
        customers: 0,
        returns: 0,
        activePromotions: 0,
      },
      ordersByStatus: [] as Array<{ label: string; value: number }>,
      paymentsByStatus: [] as Array<{ label: string; value: number }>,
      topCategories: [] as Array<{ label: string; value: number }>,
    }
  }

  const supabase = await createServiceClient()

  const [ordersResult, customersCountResult, returnsCountResult, promotionsCountResult, productsResult] =
    await Promise.all([
      supabase
        .from('orders')
        .select('status, payment_status, total_amount'),
      supabase.from('customer_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('returns').select('id', { count: 'exact', head: true }),
      supabase.from('promotions').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('products').select('category'),
    ])

  const orders = ordersResult.data ?? []
  const deliveredOrPaidRevenue = orders.reduce((total, order) => {
    if (order.status === 'delivered' || order.payment_status === 'paid') {
      return total + toNumber(order.total_amount)
    }

    return total
  }, 0)

  const orderStatusMap = new Map<string, number>()
  const paymentStatusMap = new Map<string, number>()

  for (const order of orders) {
    orderStatusMap.set(order.status, (orderStatusMap.get(order.status) ?? 0) + 1)
    paymentStatusMap.set(
      order.payment_status,
      (paymentStatusMap.get(order.payment_status) ?? 0) + 1
    )
  }

  const categoryMap = new Map<string, number>()

  for (const product of productsResult.data ?? []) {
    const label = typeof product.category === 'string' && product.category.trim()
      ? product.category.trim()
      : 'Sans categorie'
    categoryMap.set(label, (categoryMap.get(label) ?? 0) + 1)
  }

  return {
    access,
    totals: {
      revenue: deliveredOrPaidRevenue,
      orders: orders.length,
      customers: customersCountResult.count ?? 0,
      returns: returnsCountResult.count ?? 0,
      activePromotions: promotionsCountResult.count ?? 0,
    },
    ordersByStatus: Array.from(orderStatusMap.entries()).map(([label, value]) => ({
      label,
      value,
    })),
    paymentsByStatus: Array.from(paymentStatusMap.entries()).map(([label, value]) => ({
      label,
      value,
    })),
    topCategories: Array.from(categoryMap.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 6),
  }
}
