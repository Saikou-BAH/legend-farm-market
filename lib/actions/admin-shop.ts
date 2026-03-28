'use server'

import { env } from '@/lib/env'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type {
  AdminOrderSummary,
  CustomerProfile,
  DeliveryZone,
  Product,
  Promotion,
  ShopSetting,
  StaffProfile,
} from '@/types'

function toNumber(value: number | string | null | undefined) {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string' && value.trim() !== '') {
    return Number(value)
  }

  return 0
}

function mapProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    unit: row.unit,
    images: Array.isArray(row.images) ? row.images : [],
    base_price: toNumber(row.base_price),
    stock_quantity: row.stock_quantity ?? 0,
    stock_alert_threshold: row.stock_alert_threshold ?? 0,
    is_available: Boolean(row.is_available),
    is_featured: Boolean(row.is_featured),
    sort_order: row.sort_order ?? 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function mapCustomer(row: any): CustomerProfile {
  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    phone: row.phone,
    customer_type: row.customer_type,
    loyalty_points: row.loyalty_points ?? 0,
    loyalty_level: row.loyalty_level,
    credit_balance: toNumber(row.credit_balance),
    credit_limit: toNumber(row.credit_limit),
    is_blacklisted: Boolean(row.is_blacklisted),
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function mapPromotion(row: any): Promotion {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    type: row.type,
    code: row.code,
    value: toNumber(row.value),
    is_active: Boolean(row.is_active),
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    created_at: row.created_at,
  }
}

function mapDeliveryZone(row: any): DeliveryZone {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    delivery_fee: toNumber(row.delivery_fee),
    min_order_amount: toNumber(row.min_order_amount),
    estimated_delay: row.estimated_delay,
    available_slots: Array.isArray(row.available_slots) ? row.available_slots : [],
    available_days: Array.isArray(row.available_days) ? row.available_days : [],
    is_active: Boolean(row.is_active),
  }
}

function mapSetting(row: any): ShopSetting {
  return {
    id: row.id,
    key: row.key,
    value: row.value,
    description: row.description,
    updated_at: row.updated_at,
  }
}

async function getAdminAccess() {
  if (!env.hasSupabase()) {
    return {
      status: 'misconfigured' as const,
      staff: null as StaffProfile | null,
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      status: 'unauthenticated' as const,
      staff: null,
    }
  }

  const { data } = await supabase
    .from('staff_profiles')
    .select('id, full_name, email, role, is_active, created_at, updated_at')
    .eq('id', user.id)
    .maybeSingle()

  if (!data || !data.is_active) {
    return {
      status: 'forbidden' as const,
      staff: null,
    }
  }

  return {
    status: env.hasServiceRole() ? ('ready' as const) : ('missing_service_role' as const),
    staff: data as StaffProfile,
  }
}

async function createAdminDataClient() {
  const access = await getAdminAccess()

  if (access.status !== 'ready') {
    return {
      access,
      supabase: null,
    }
  }

  return {
    access,
    supabase: await createServiceClient(),
  }
}

export async function getAdminDashboardData() {
  const { access, supabase } = await createAdminDataClient()

  if (!supabase) {
    return {
      access,
      productsCount: 0,
      ordersTodayCount: 0,
      customersCount: 0,
      activePromotionsCount: 0,
      recentOrders: [] as AdminOrderSummary[],
    }
  }

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [
    productsCountResult,
    ordersTodayCountResult,
    customersCountResult,
    activePromotionsCountResult,
    recentOrdersResult,
    customersResult,
  ] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString()),
    supabase.from('customer_profiles').select('id', { count: 'exact', head: true }),
    supabase
      .from('promotions')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true),
    supabase
      .from('orders')
      .select('id, reference, status, total_amount, created_at, customer_id')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase.from('customer_profiles').select('id, full_name'),
  ])

  const customersById = new Map(
    (customersResult.data ?? []).map((customer) => [customer.id, customer.full_name])
  )

  const recentOrders = (recentOrdersResult.data ?? []).map((order) => ({
    id: order.id,
    reference: order.reference,
    status: order.status,
    total_amount: toNumber(order.total_amount),
    created_at: order.created_at,
    customer_id: order.customer_id,
    customer_name: order.customer_id ? customersById.get(order.customer_id) ?? null : null,
  }))

  return {
    access,
    productsCount: productsCountResult.count ?? 0,
    ordersTodayCount: ordersTodayCountResult.count ?? 0,
    customersCount: customersCountResult.count ?? 0,
    activePromotionsCount: activePromotionsCountResult.count ?? 0,
    recentOrders,
  }
}

export async function getAdminProducts() {
  const { access, supabase } = await createAdminDataClient()

  if (!supabase) {
    return {
      access,
      products: [] as Product[],
    }
  }

  const { data } = await supabase
    .from('products')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  return {
    access,
    products: (data ?? []).map(mapProduct),
  }
}

export async function getAdminOrders() {
  const { access, supabase } = await createAdminDataClient()

  if (!supabase) {
    return {
      access,
      orders: [] as AdminOrderSummary[],
    }
  }

  const [ordersResult, customersResult] = await Promise.all([
    supabase
      .from('orders')
      .select('id, reference, status, total_amount, created_at, customer_id')
      .order('created_at', { ascending: false })
      .limit(30),
    supabase.from('customer_profiles').select('id, full_name'),
  ])

  const customersById = new Map(
    (customersResult.data ?? []).map((customer) => [customer.id, customer.full_name])
  )

  return {
    access,
    orders: (ordersResult.data ?? []).map((order) => ({
      id: order.id,
      reference: order.reference,
      status: order.status,
      total_amount: toNumber(order.total_amount),
      created_at: order.created_at,
      customer_id: order.customer_id,
      customer_name: order.customer_id ? customersById.get(order.customer_id) ?? null : null,
    })),
  }
}

export async function getAdminCustomers() {
  const { access, supabase } = await createAdminDataClient()

  if (!supabase) {
    return {
      access,
      customers: [] as CustomerProfile[],
    }
  }

  const { data } = await supabase
    .from('customer_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return {
    access,
    customers: (data ?? []).map(mapCustomer),
  }
}

export async function getAdminPromotions() {
  const { access, supabase } = await createAdminDataClient()

  if (!supabase) {
    return {
      access,
      promotions: [] as Promotion[],
    }
  }

  const { data } = await supabase
    .from('promotions')
    .select('*')
    .order('created_at', { ascending: false })

  return {
    access,
    promotions: (data ?? []).map(mapPromotion),
  }
}

export async function getAdminDeliveryZones() {
  const { access, supabase } = await createAdminDataClient()

  if (!supabase) {
    return {
      access,
      zones: [] as DeliveryZone[],
    }
  }

  const { data } = await supabase
    .from('delivery_zones')
    .select('*')
    .order('city', { ascending: true })
    .order('name', { ascending: true })

  return {
    access,
    zones: (data ?? []).map(mapDeliveryZone),
  }
}

export async function getAdminSettings() {
  const { access, supabase } = await createAdminDataClient()

  if (!supabase) {
    return {
      access,
      settings: [] as ShopSetting[],
    }
  }

  const { data } = await supabase
    .from('shop_settings')
    .select('*')
    .order('key', { ascending: true })

  return {
    access,
    settings: (data ?? []).map(mapSetting),
  }
}
