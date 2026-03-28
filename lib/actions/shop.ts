'use server'

import { env } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'
import type {
  CustomerAddress,
  CustomerProfile,
  Order,
  Product,
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

function mapOrder(row: any): Order {
  return {
    id: row.id,
    reference: row.reference,
    customer_id: row.customer_id,
    status: row.status,
    delivery_type: row.delivery_type,
    delivery_zone: row.delivery_zone,
    payment_method: row.payment_method,
    payment_status: row.payment_status,
    subtotal: toNumber(row.subtotal),
    discount_amount: toNumber(row.discount_amount),
    delivery_fee: toNumber(row.delivery_fee),
    total_amount: toNumber(row.total_amount),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function mapCustomerProfile(row: any): CustomerProfile {
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

function mapCustomerAddress(row: any): CustomerAddress {
  return {
    id: row.id,
    customer_id: row.customer_id,
    label: row.label,
    full_address: row.full_address,
    city: row.city,
    zone: row.zone,
    phone: row.phone,
    is_default: Boolean(row.is_default),
    created_at: row.created_at,
  }
}

export async function getHomePageData() {
  if (!env.hasSupabase()) {
    return {
      isConfigured: false,
      featuredProducts: [] as Product[],
      productCount: null as number | null,
      deliveryZoneCount: null as number | null,
      welcomePoints: null as number | null,
    }
  }

  const supabase = await createClient()

  const [
    featuredProductsResult,
    productCountResult,
    deliveryZoneCountResult,
    welcomePointsResult,
  ] = await Promise.all([
    supabase
      .from('products')
      .select(
        'id, name, description, category, unit, images, base_price, stock_quantity, stock_alert_threshold, is_available, is_featured, sort_order, created_at, updated_at'
      )
      .eq('is_available', true)
      .order('is_featured', { ascending: false })
      .order('sort_order', { ascending: true })
      .limit(3),
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('is_available', true),
    supabase
      .from('delivery_zones')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true),
    supabase.from('shop_settings').select('value').eq('key', 'welcome_points').maybeSingle(),
  ])

  return {
    isConfigured: true,
    featuredProducts: (featuredProductsResult.data ?? []).map(mapProduct),
    productCount: productCountResult.count ?? 0,
    deliveryZoneCount: deliveryZoneCountResult.count ?? 0,
    welcomePoints:
      typeof welcomePointsResult.data?.value === 'string'
        ? Number(welcomePointsResult.data.value)
        : null,
  }
}

export async function getCatalogProducts() {
  if (!env.hasSupabase()) {
    return {
      isConfigured: false,
      products: [] as Product[],
    }
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select(
      'id, name, description, category, unit, images, base_price, stock_quantity, stock_alert_threshold, is_available, is_featured, sort_order, created_at, updated_at'
    )
    .eq('is_available', true)
    .order('is_featured', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  return {
    isConfigured: true,
    products: (data ?? []).map(mapProduct),
  }
}

export async function getCurrentCustomerAccount() {
  if (!env.hasSupabase()) {
    return {
      isConfigured: false,
      isAuthenticated: false,
      profile: null as CustomerProfile | null,
      addresses: [] as CustomerAddress[],
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      isConfigured: true,
      isAuthenticated: false,
      profile: null,
      addresses: [],
    }
  }

  const [profileResult, addressesResult] = await Promise.all([
    supabase.from('customer_profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase
      .from('customer_addresses')
      .select('*')
      .eq('customer_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false }),
  ])

  return {
    isConfigured: true,
    isAuthenticated: true,
    profile: profileResult.data ? mapCustomerProfile(profileResult.data) : null,
    addresses: (addressesResult.data ?? []).map(mapCustomerAddress),
  }
}

export async function getCurrentCustomerOrders() {
  if (!env.hasSupabase()) {
    return {
      isConfigured: false,
      isAuthenticated: false,
      orders: [] as Order[],
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      isConfigured: true,
      isAuthenticated: false,
      orders: [],
    }
  }

  const { data } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  return {
    isConfigured: true,
    isAuthenticated: true,
    orders: (data ?? []).map(mapOrder),
  }
}
