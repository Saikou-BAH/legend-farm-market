'use server'

import { env } from '@/lib/env'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type {
  AdminActivityLog,
  AdminOrderDetail,
  AdminOrderSummary,
  CustomerProfile,
  DeliveryZone,
  EmailCampaign,
  Order,
  OrderItem,
  PaymentTransaction,
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
    availability_status: row.availability_status ?? 'available',
    availability_label: row.availability_label ?? null,
    restock_note: row.restock_note ?? null,
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
    admin_discount: toNumber(row.admin_discount),
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

function mapPaymentTransaction(
  row: any,
  createdByStaffName: string | null = null
): PaymentTransaction {
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
    created_by_staff_name: createdByStaffName,
    processed_at: row.processed_at,
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

function mapEmailCampaign(row: any): EmailCampaign {
  return {
    id: row.id,
    name: row.name,
    subject: row.subject,
    content_html: row.content_html,
    segment: row.segment,
    status: row.status,
    scheduled_at: row.scheduled_at,
    sent_at: row.sent_at,
    recipients_count: row.recipients_count ?? 0,
    opens_count: row.opens_count ?? 0,
    clicks_count: row.clicks_count ?? 0,
    created_at: row.created_at,
  }
}

function mapAdminActivityLog(row: any, staffName: string | null = null): AdminActivityLog {
  return {
    id: row.id,
    staff_id: row.staff_id ?? null,
    staff_name: staffName,
    action: row.action,
    entity_type: row.entity_type,
    entity_id: row.entity_id ?? null,
    summary: row.summary,
    metadata:
      row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
        ? row.metadata
        : null,
    created_at: row.created_at,
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
    .select('id, full_name, email, phone, role, is_active, created_at, updated_at')
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
      recentActivity: [] as AdminActivityLog[],
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
    activityLogsResult,
    staffProfilesResult,
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
    supabase
      .from('admin_activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase.from('staff_profiles').select('id, full_name'),
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

  const staffNamesById = new Map(
    (staffProfilesResult.data ?? []).map((staff) => [staff.id, staff.full_name])
  )

  return {
    access,
    productsCount: productsCountResult.count ?? 0,
    ordersTodayCount: ordersTodayCountResult.count ?? 0,
    customersCount: customersCountResult.count ?? 0,
    activePromotionsCount: activePromotionsCountResult.count ?? 0,
    recentOrders,
    recentActivity: (activityLogsResult.data ?? []).map((entry) =>
      mapAdminActivityLog(
        entry,
        entry.staff_id ? staffNamesById.get(entry.staff_id) ?? null : null
      )
    ),
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

export async function getAdminProductById(id: string) {
  const { access, supabase } = await createAdminDataClient()

  if (!supabase) {
    return {
      access,
      product: null as Product | null,
    }
  }

  const { data } = await supabase.from('products').select('*').eq('id', id).maybeSingle()

  return {
    access,
    product: data ? mapProduct(data) : null,
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
      .order('created_at', { ascending: false }),
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

export async function getAdminOrderById(id: string) {
  const { access, supabase } = await createAdminDataClient()

  if (!supabase) {
    return {
      access,
      order: null as AdminOrderDetail | null,
    }
  }

  const [orderResult, itemsResult, paymentTransactionsResult, staffProfilesResult] = await Promise.all([
    supabase.from('orders').select('*').eq('id', id).maybeSingle(),
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
    supabase.from('staff_profiles').select('id, full_name'),
  ])

  if (!orderResult.data) {
    return {
      access,
      order: null,
    }
  }

  const staffNamesById = new Map(
    (staffProfilesResult.data ?? []).map((staff) => [staff.id, staff.full_name])
  )

  let customerName: string | null = null
  let customerEmail: string | null = null

  if (orderResult.data.customer_id) {
    const { data: customerData } = await supabase
      .from('customer_profiles')
      .select('full_name, email')
      .eq('id', orderResult.data.customer_id)
      .maybeSingle()

    customerName = customerData?.full_name ?? null
    customerEmail = customerData?.email ?? null
  }

  return {
    access,
    order: {
      ...mapOrder(orderResult.data),
      customer_name: orderResult.data.customer_id ? customerName : (orderResult.data.guest_name ?? null),
      customer_email: customerEmail,
      guest_name: orderResult.data.guest_name ?? null,
      guest_phone: orderResult.data.guest_phone ?? null,
      items: (itemsResult.data ?? []).map(mapOrderItem),
      paymentTransactions: paymentTransactionsResult.error
        ? []
        : (paymentTransactionsResult.data ?? []).map((transaction) =>
            mapPaymentTransaction(
              transaction,
              transaction.created_by_staff_id
                ? staffNamesById.get(transaction.created_by_staff_id) ?? null
                : null
            )
          ),
    },
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

export async function getAdminCustomerById(id: string) {
  const { access, supabase } = await createAdminDataClient()

  if (!supabase) {
    return {
      access,
      customer: null as CustomerProfile | null,
    }
  }

  const { data } = await supabase
    .from('customer_profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  return {
    access,
    customer: data ? mapCustomer(data) : null,
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

export async function getAdminPromotionById(id: string) {
  const { access, supabase } = await createAdminDataClient()

  if (!supabase) {
    return {
      access,
      promotion: null as Promotion | null,
    }
  }

  const { data } = await supabase
    .from('promotions')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  return {
    access,
    promotion: data ? mapPromotion(data) : null,
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

export async function getAdminShopSettings() {
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

export async function getAdminSettings() {
  return getAdminShopSettings()
}

export async function getAdminEmailCampaigns() {
  const { access, supabase } = await createAdminDataClient()

  if (!supabase) {
    return {
      access,
      campaigns: [] as EmailCampaign[],
    }
  }

  const { data } = await supabase
    .from('email_campaigns')
    .select('*')
    .order('created_at', { ascending: false })

  return {
    access,
    campaigns: (data ?? []).map(mapEmailCampaign),
  }
}

export async function getAdminEmailCampaignById(id: string) {
  const { access, supabase } = await createAdminDataClient()

  if (!supabase) {
    return {
      access,
      campaign: null as EmailCampaign | null,
    }
  }

  const { data } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  return {
    access,
    campaign: data ? mapEmailCampaign(data) : null,
  }
}
