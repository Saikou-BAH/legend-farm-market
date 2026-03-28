'use server'

import { env } from '@/lib/env'
import {
  filterCatalogProducts,
  getCatalogCategories,
  normalizeCatalogFilter,
} from '@/lib/shop-catalog'
import { createClient } from '@/lib/supabase/server'
import type {
  CustomerAddress,
  CustomerProfile,
  DeliveryZone,
  Order,
  OrderDetail,
  OrderItem,
  PaymentTransaction,
  Product,
  Promotion,
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

function toNullableNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string' && value.trim() !== '') {
    return Number(value)
  }

  return null
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
    price_tier_1_qty: toNullableNumber(row.price_tier_1_qty),
    price_tier_1_price: toNullableNumber(row.price_tier_1_price),
    price_tier_2_qty: toNullableNumber(row.price_tier_2_qty),
    price_tier_2_price: toNullableNumber(row.price_tier_2_price),
    price_tier_3_qty: toNullableNumber(row.price_tier_3_qty),
    price_tier_3_price: toNullableNumber(row.price_tier_3_price),
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
    delivery_address_id: row.delivery_address_id,
    delivery_zone: row.delivery_zone,
    delivery_date: row.delivery_date,
    delivery_slot: row.delivery_slot,
    delivery_instructions: row.delivery_instructions,
    delivery_person_id: row.delivery_person_id,
    delivered_at: row.delivered_at,
    payment_method: row.payment_method,
    payment_status: row.payment_status,
    paid_at: row.paid_at,
    subtotal: toNumber(row.subtotal),
    discount_amount: toNumber(row.discount_amount),
    delivery_fee: toNumber(row.delivery_fee),
    total_amount: toNumber(row.total_amount),
    points_used: row.points_used ?? 0,
    points_earned: row.points_earned ?? 0,
    promo_code: row.promo_code,
    promo_id: row.promo_id,
    customer_notes: row.customer_notes,
    admin_notes: row.admin_notes,
    cancellation_reason: row.cancellation_reason,
    cancelled_at: row.cancelled_at,
    inventory_reserved_at: row.inventory_reserved_at,
    inventory_released_at: row.inventory_released_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function mapOrderItem(row: any): OrderItem {
  return {
    id: row.id,
    order_id: row.order_id,
    product_id: row.product_id,
    product_name: row.product_name,
    product_unit: row.product_unit,
    quantity: row.quantity ?? 0,
    unit_price: toNumber(row.unit_price),
    total_price: toNumber(row.total_price),
    alveoles_quantity: row.alveoles_quantity ?? 0,
    alveoles_option: row.alveoles_option,
    created_at: row.created_at,
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

function mapPaymentTransaction(row: any): PaymentTransaction {
  return {
    id: row.id,
    order_id: row.order_id,
    customer_id: row.customer_id,
    payment_method: row.payment_method,
    transaction_type: row.transaction_type,
    status: row.status,
    amount: toNumber(row.amount),
    currency_code: row.currency_code,
    provider: row.provider,
    provider_reference: row.provider_reference,
    note: row.note,
    created_by_staff_id: row.created_by_staff_id,
    created_by_staff_name: null,
    processed_at: row.processed_at,
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
    min_order_amount: toNumber(row.min_order_amount),
    max_uses: toNullableNumber(row.max_uses),
    max_uses_per_customer: row.max_uses_per_customer ?? 0,
    current_uses: row.current_uses ?? 0,
    customer_types: Array.isArray(row.customer_types) ? row.customer_types : null,
    customer_levels: Array.isArray(row.customer_levels) ? row.customer_levels : null,
    product_ids: Array.isArray(row.product_ids) ? row.product_ids : null,
    zones: Array.isArray(row.zones) ? row.zones : null,
    is_active: Boolean(row.is_active),
    is_cumulative: Boolean(row.is_cumulative),
    starts_at: row.starts_at,
    ends_at: row.ends_at,
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

  const [featuredProductsResult, productCountResult, deliveryZoneCountResult, welcomePointsResult] =
    await Promise.all([
      supabase
        .from('products')
        .select('*')
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

  const homeProducts = (featuredProductsResult.data ?? []).map(mapProduct)
  const featuredProducts = homeProducts.filter((product) => product.is_featured).slice(0, 3)

  return {
    isConfigured: true,
    featuredProducts: featuredProducts.length > 0 ? featuredProducts : homeProducts.slice(0, 3),
    productCount: productCountResult.count ?? 0,
    deliveryZoneCount: deliveryZoneCountResult.count ?? 0,
    welcomePoints:
      typeof welcomePointsResult.data?.value === 'string'
        ? Number(welcomePointsResult.data.value)
        : null,
  }
}

export async function getCatalogProducts(filters?: {
  search?: string | null
  category?: string | null
}) {
  const activeSearch = normalizeCatalogFilter(filters?.search)
  const requestedCategory = normalizeCatalogFilter(filters?.category)

  if (!env.hasSupabase()) {
    return {
      isConfigured: false,
      products: [] as Product[],
      categories: [] as string[],
      totalCount: 0,
      resultCount: 0,
      activeFilters: {
        search: activeSearch,
        category: requestedCategory,
      },
    }
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('is_available', true)
    .order('is_featured', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  const allProducts = (data ?? []).map(mapProduct)
  const categories = getCatalogCategories(allProducts)
  const activeCategory =
    categories.find(
      (category) => category.toLowerCase() === requestedCategory?.toLowerCase()
    ) ?? null
  const products = filterCatalogProducts(allProducts, {
    search: activeSearch,
    category: activeCategory,
  })

  return {
    isConfigured: true,
    products,
    categories,
    totalCount: allProducts.length,
    resultCount: products.length,
    activeFilters: {
      search: activeSearch,
      category: activeCategory,
    },
  }
}

export async function getCatalogProductById(id: string) {
  if (!env.hasSupabase()) {
    return {
      isConfigured: false,
      product: null as Product | null,
    }
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('is_available', true)
    .maybeSingle()

  return {
    isConfigured: true,
    product: data ? mapProduct(data) : null,
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

export async function getCheckoutPageData() {
  if (!env.hasSupabase()) {
    return {
      isConfigured: false,
      isAuthenticated: false,
      profile: null as CustomerProfile | null,
      addresses: [] as CustomerAddress[],
      deliveryZones: [] as DeliveryZone[],
      minOrderAmount: 0,
      activePromotions: [] as Promotion[],
      loyaltyPointValue: 1,
      loyaltyPointsRate: 1,
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
      deliveryZones: [] as DeliveryZone[],
      minOrderAmount: 0,
      activePromotions: [] as Promotion[],
      loyaltyPointValue: 1,
      loyaltyPointsRate: 1,
    }
  }

  const [
    profileResult,
    addressesResult,
    deliveryZonesResult,
    minOrderAmountResult,
    promotionsResult,
    loyaltyPointValueResult,
    loyaltyPointsRateResult,
  ] =
    await Promise.all([
      supabase.from('customer_profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase
        .from('customer_addresses')
        .select('*')
        .eq('customer_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase
        .from('delivery_zones')
        .select('*')
        .eq('is_active', true)
        .order('delivery_fee', { ascending: true })
        .order('name', { ascending: true }),
      supabase.from('shop_settings').select('value').eq('key', 'min_order_amount').maybeSingle(),
      supabase.from('promotions').select('*').order('created_at', { ascending: false }),
      supabase.from('shop_settings').select('value').eq('key', 'loyalty_point_value').maybeSingle(),
      supabase.from('shop_settings').select('value').eq('key', 'loyalty_points_rate').maybeSingle(),
    ])

  return {
    isConfigured: true,
    isAuthenticated: true,
    profile: profileResult.data ? mapCustomerProfile(profileResult.data) : null,
    addresses: (addressesResult.data ?? []).map(mapCustomerAddress),
    deliveryZones: (deliveryZonesResult.data ?? []).map(mapDeliveryZone),
    minOrderAmount:
      typeof minOrderAmountResult.data?.value === 'string'
        ? Number(minOrderAmountResult.data.value)
        : 0,
    activePromotions: (promotionsResult.data ?? []).map(mapPromotion),
    loyaltyPointValue:
      typeof loyaltyPointValueResult.data?.value === 'string'
        ? Number(loyaltyPointValueResult.data.value)
        : 1,
    loyaltyPointsRate:
      typeof loyaltyPointsRateResult.data?.value === 'string'
        ? Number(loyaltyPointsRateResult.data.value)
        : 1,
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

  return {
    isConfigured: true,
    isAuthenticated: true,
    orders: (data ?? []).map(mapOrder),
  }
}

export async function getCurrentCustomerOrderById(id: string) {
  if (!env.hasSupabase()) {
    return {
      isConfigured: false,
      isAuthenticated: false,
      order: null as OrderDetail | null,
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
      order: null,
    }
  }

  const [orderResult, itemsResult, paymentTransactionsResult] = await Promise.all([
    supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .eq('customer_id', user.id)
      .maybeSingle(),
    supabase
      .from('order_items')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('payment_transactions')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (!orderResult.data) {
    return {
      isConfigured: true,
      isAuthenticated: true,
      order: null,
    }
  }

  return {
    isConfigured: true,
    isAuthenticated: true,
    order: {
      ...mapOrder(orderResult.data),
      items: (itemsResult.data ?? []).map(mapOrderItem),
      paymentTransactions: paymentTransactionsResult.error
        ? []
        : (paymentTransactionsResult.data ?? []).map(mapPaymentTransaction),
    },
  }
}

export async function getPublicShopProfile() {
  const fallbackProfile = {
    shopName: 'Legend Farm Shop',
    shopEmail: 'contact@legendfarm.gn',
    shopPhone: null as string | null,
    shopAddress: 'Conakry, Guinee',
  }

  if (!env.hasSupabase()) {
    return {
      isConfigured: false,
      ...fallbackProfile,
    }
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('shop_settings')
    .select('key, value')
    .in('key', ['shop_name', 'shop_email', 'shop_phone', 'shop_address'])

  const settings = new Map((data ?? []).map((row) => [row.key, row.value]))

  return {
    isConfigured: true,
    shopName:
      normalizeCatalogFilter(settings.get('shop_name')) ?? fallbackProfile.shopName,
    shopEmail:
      normalizeCatalogFilter(settings.get('shop_email')) ?? fallbackProfile.shopEmail,
    shopPhone:
      normalizeCatalogFilter(settings.get('shop_phone')) ?? fallbackProfile.shopPhone,
    shopAddress:
      normalizeCatalogFilter(settings.get('shop_address')) ?? fallbackProfile.shopAddress,
  }
}

export async function getPublicDeliveryZones() {
  if (!env.hasSupabase()) {
    return {
      isConfigured: false,
      zones: [] as DeliveryZone[],
    }
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('delivery_zones')
    .select('*')
    .eq('is_active', true)
    .order('delivery_fee', { ascending: true })
    .order('name', { ascending: true })

  return {
    isConfigured: true,
    zones: (data ?? []).map(mapDeliveryZone),
  }
}
