'use server'

import { env } from '@/lib/env'
import { createClient, createServiceClient } from '@/lib/supabase/server'

function toNumber(value: number | string | null | undefined) {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim() !== '') return Number(value)
  return 0
}

async function requireStaffAccess() {
  if (!env.hasSupabase()) return { status: 'misconfigured' as const }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { status: 'unauthenticated' as const }

  const { data } = await supabase
    .from('staff_profiles')
    .select('id, is_active')
    .eq('id', user.id)
    .maybeSingle()

  if (!data?.is_active) return { status: 'forbidden' as const }
  if (!env.hasServiceRole()) return { status: 'missing_service_role' as const }

  return { status: 'ready' as const }
}

// ── Stats par produit ──────────────────────────────────────────────────────────

export interface ProductStat {
  product_id: string
  product_name: string
  category: string
  unit: string
  stock_quantity: number
  orders_count: number
  quantity_sold: number
  revenue: number
}

export async function getStatsByProduct() {
  const access = await requireStaffAccess()

  const empty: ProductStat[] = []

  if (access.status !== 'ready') {
    return { access, stats: empty }
  }

  const supabase = await createServiceClient()

  const [productsResult, orderItemsResult] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, category, unit, stock_quantity')
      .order('name'),
    supabase
      .from('order_items')
      .select('product_id, quantity, total_price, order:orders(status)')
      .not('product_id', 'is', null),
  ])

  const products = productsResult.data ?? []
  const items = orderItemsResult.data ?? []

  const statsMap = new Map<
    string,
    { orders_count: number; quantity_sold: number; revenue: number }
  >()

  for (const item of items) {
    const order = Array.isArray(item.order) ? item.order[0] : item.order
    if (!item.product_id || order?.status === 'cancelled') continue

    const existing = statsMap.get(item.product_id) ?? {
      orders_count: 0,
      quantity_sold: 0,
      revenue: 0,
    }
    statsMap.set(item.product_id, {
      orders_count: existing.orders_count + 1,
      quantity_sold: existing.quantity_sold + toNumber(item.quantity),
      revenue: existing.revenue + toNumber(item.total_price),
    })
  }

  const stats: ProductStat[] = products.map((p) => {
    const agg = statsMap.get(p.id) ?? { orders_count: 0, quantity_sold: 0, revenue: 0 }
    return {
      product_id: p.id,
      product_name: p.name,
      category: p.category,
      unit: p.unit,
      stock_quantity: toNumber(p.stock_quantity),
      ...agg,
    }
  })

  return { access, stats }
}

// ── Stats par client ───────────────────────────────────────────────────────────

export interface CustomerStat {
  customer_id: string
  full_name: string
  email: string
  customer_type: string
  orders_count: number
  total_spent: number
  last_order_at: string | null
}

export async function getStatsByCustomer() {
  const access = await requireStaffAccess()

  const empty: CustomerStat[] = []

  if (access.status !== 'ready') {
    return { access, stats: empty }
  }

  const supabase = await createServiceClient()

  const [customersResult, ordersResult] = await Promise.all([
    supabase
      .from('customer_profiles')
      .select('id, full_name, email, customer_type')
      .order('full_name'),
    supabase
      .from('orders')
      .select('customer_id, total_amount, status, created_at')
      .not('customer_id', 'is', null),
  ])

  const customers = customersResult.data ?? []
  const orders = ordersResult.data ?? []

  const statsMap = new Map<
    string,
    { orders_count: number; total_spent: number; last_order_at: string | null }
  >()

  for (const order of orders) {
    if (!order.customer_id || order.status === 'cancelled') continue

    const existing = statsMap.get(order.customer_id) ?? {
      orders_count: 0,
      total_spent: 0,
      last_order_at: null,
    }

    const orderDate = order.created_at as string | null

    statsMap.set(order.customer_id, {
      orders_count: existing.orders_count + 1,
      total_spent: existing.total_spent + toNumber(order.total_amount),
      last_order_at:
        !existing.last_order_at ||
        (orderDate && orderDate > existing.last_order_at)
          ? orderDate
          : existing.last_order_at,
    })
  }

  const stats: CustomerStat[] = customers.map((c) => {
    const agg = statsMap.get(c.id) ?? {
      orders_count: 0,
      total_spent: 0,
      last_order_at: null,
    }
    return {
      customer_id: c.id,
      full_name: c.full_name,
      email: c.email,
      customer_type: c.customer_type,
      ...agg,
    }
  })

  return { access, stats }
}

// ── Stats par bande (flock batch) ─────────────────────────────────────────────

export interface FlockBatchStat {
  batch_id: string
  batch_name: string
  batch_date: string
  product_name: string
  product_id: string | null
  initial_quantity: number
  remaining_quantity: number
  consumed: number
  cost_per_unit: number | null
  status: string
  revenue_from_movements: number   // CA articles (hors transport)
  delivery_fee_share: number       // Part du transport attribuée à cette bande
  total_revenue: number            // CA articles + part transport
}

export async function getStatsByFlockBatch() {
  const access = await requireStaffAccess()

  const empty: FlockBatchStat[] = []

  if (access.status !== 'ready') {
    return { access, stats: empty }
  }

  const supabase = await createServiceClient()

  const [batchesResult, movementsResult, ordersResult] = await Promise.all([
    supabase
      .from('flock_batches')
      .select('id, name, batch_date, product_id, initial_quantity, remaining_quantity, cost_per_unit, status, products(name)')
      .order('batch_date', { ascending: false }),
    supabase
      .from('stock_movements')
      .select('stock_entry_id, quantity_consumed, order_item_id, order_items(total_price, order_id), stock_entries(flock_batch_id)'),
    // Frais de livraison par commande (pour répartition proportionnelle)
    supabase
      .from('orders')
      .select('id, subtotal, delivery_fee, admin_discount, status')
      .neq('status', 'cancelled'),
  ])

  const batches = batchesResult.data ?? []
  const movements = movementsResult.data ?? []
  const orders = ordersResult.data ?? []

  // Index des commandes pour accès O(1)
  const orderById = new Map(orders.map((o) => [o.id as string, o]))

  // Première passe : articles CA par bande, et contribution par commande
  // Structure : batchId → Map<orderId, itemsRevenue>
  const batchOrderRevenue = new Map<string, Map<string, number>>()
  const revenueByBatch = new Map<string, number>()

  for (const movement of movements) {
    const entry = Array.isArray(movement.stock_entries)
      ? movement.stock_entries[0]
      : movement.stock_entries
    const batchId = entry?.flock_batch_id as string | null
    if (!batchId) continue

    const orderItem = Array.isArray(movement.order_items)
      ? movement.order_items[0]
      : movement.order_items
    const itemPrice = toNumber(orderItem?.total_price)
    const orderId = orderItem?.order_id as string | null

    // CA articles par bande
    revenueByBatch.set(batchId, (revenueByBatch.get(batchId) ?? 0) + itemPrice)

    // Contribution par commande (pour répartir le transport)
    if (orderId) {
      if (!batchOrderRevenue.has(batchId)) {
        batchOrderRevenue.set(batchId, new Map())
      }
      const orderMap = batchOrderRevenue.get(batchId)!
      orderMap.set(orderId, (orderMap.get(orderId) ?? 0) + itemPrice)
    }
  }

  // Deuxième passe : calculer la part du transport par bande
  // Pour chaque commande avec un frais de livraison, distribuer
  // proportionnellement entre les bandes selon leur CA dans cette commande.
  //
  // On calcule d'abord, pour chaque commande, le CA total des articles
  // ventilé par bande.
  const deliveryShareByBatch = new Map<string, number>()

  // Construire l'index inverse : orderId → { batchId → itemsRevenue }
  const orderBatchRevenue = new Map<string, Map<string, number>>()
  for (const [batchId, orderMap] of batchOrderRevenue.entries()) {
    for (const [orderId, rev] of orderMap.entries()) {
      if (!orderBatchRevenue.has(orderId)) {
        orderBatchRevenue.set(orderId, new Map())
      }
      orderBatchRevenue.get(orderId)!.set(batchId, rev)
    }
  }

  for (const [orderId, batchMap] of orderBatchRevenue.entries()) {
    const order = orderById.get(orderId)
    if (!order) continue

    const deliveryFee = toNumber(order.delivery_fee)
    if (deliveryFee <= 0) continue

    // Total des articles de cette commande issus de bandes tracées
    const tracedTotal = Array.from(batchMap.values()).reduce((s, v) => s + v, 0)
    if (tracedTotal <= 0) continue

    for (const [batchId, batchRev] of batchMap.entries()) {
      const share = (batchRev / tracedTotal) * deliveryFee
      deliveryShareByBatch.set(batchId, (deliveryShareByBatch.get(batchId) ?? 0) + share)
    }
  }

  const stats: FlockBatchStat[] = batches.map((b) => {
    const productName = Array.isArray(b.products)
      ? (b.products[0] as { name: string } | undefined)?.name ?? '—'
      : (b.products as { name: string } | null)?.name ?? '—'

    const revenue = revenueByBatch.get(b.id) ?? 0
    const deliveryShare = Math.round(deliveryShareByBatch.get(b.id) ?? 0)

    return {
      batch_id: b.id,
      batch_name: b.name,
      batch_date: b.batch_date as string,
      product_name: productName,
      product_id: b.product_id ?? null,
      initial_quantity: toNumber(b.initial_quantity),
      remaining_quantity: toNumber(b.remaining_quantity),
      consumed: toNumber(b.initial_quantity) - toNumber(b.remaining_quantity),
      cost_per_unit: b.cost_per_unit != null ? toNumber(b.cost_per_unit) : null,
      status: b.status as string,
      revenue_from_movements: revenue,
      delivery_fee_share: deliveryShare,
      total_revenue: revenue + deliveryShare,
    }
  })

  return { access, stats }
}

// ── Vue globale enrichie ───────────────────────────────────────────────────────

export interface GlobalStats {
  revenue: number
  orders_count: number
  customers_count: number
  active_batches: number
  total_stock_value: number
}

export async function getGlobalStats() {
  const access = await requireStaffAccess()

  const empty: GlobalStats = {
    revenue: 0,
    orders_count: 0,
    customers_count: 0,
    active_batches: 0,
    total_stock_value: 0,
  }

  if (access.status !== 'ready') {
    return { access, stats: empty }
  }

  const supabase = await createServiceClient()

  const [ordersResult, customersResult, batchesResult, productsResult] =
    await Promise.all([
      supabase
        .from('orders')
        .select('total_amount, status, payment_status'),
      supabase
        .from('customer_profiles')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('flock_batches')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
      supabase
        .from('products')
        .select('stock_quantity, base_price')
        .eq('is_available', true),
    ])

  const orders = ordersResult.data ?? []

  const revenue = orders.reduce((sum, o) => {
    if (o.status === 'delivered' || o.payment_status === 'paid') {
      return sum + toNumber(o.total_amount)
    }
    return sum
  }, 0)

  const totalStockValue = (productsResult.data ?? []).reduce((sum, p) => {
    return sum + toNumber(p.stock_quantity) * toNumber(p.base_price)
  }, 0)

  return {
    access,
    stats: {
      revenue,
      orders_count: orders.length,
      customers_count: customersResult.count ?? 0,
      active_batches: batchesResult.count ?? 0,
      total_stock_value: totalStockValue,
    } satisfies GlobalStats,
  }
}
