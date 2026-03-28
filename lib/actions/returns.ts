'use server'

import { revalidatePath } from 'next/cache'
import {
  recordAdminActivity,
  requireAdminMutationContext,
} from '@/lib/admin-mutations'
import { env } from '@/lib/env'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type {
  ActionResult,
  AdminReturnDetail,
  ReturnItemDetail,
  ReturnReason,
  ReturnRequest,
  ReturnResolution,
  ReturnStatus,
} from '@/types'

const returnReasons: ReturnReason[] = [
  'defective',
  'poor_quality',
  'wrong_order',
  'wrong_quantity',
  'other',
]
const returnStatuses: ReturnStatus[] = ['pending', 'approved', 'rejected', 'completed']
const returnResolutions: ReturnResolution[] = ['refund', 'credit', 'exchange']
const returnRoles = ['admin', 'manager', 'support'] as const

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

  return toNumber(value)
}

function normalizeRequiredText(
  value: string | null | undefined,
  label: string,
  maxLength: number
) {
  const nextValue = value?.trim() ?? ''

  if (!nextValue) {
    throw new Error(`${label} est obligatoire.`)
  }

  return nextValue.slice(0, maxLength)
}

function normalizeOptionalText(value: string | null | undefined, maxLength: number) {
  const nextValue = value?.trim() ?? ''
  return nextValue ? nextValue.slice(0, maxLength) : null
}

function isReturnReason(value: string): value is ReturnReason {
  return returnReasons.includes(value as ReturnReason)
}

function isReturnStatus(value: string): value is ReturnStatus {
  return returnStatuses.includes(value as ReturnStatus)
}

function isReturnResolution(value: string): value is ReturnResolution {
  return returnResolutions.includes(value as ReturnResolution)
}

function mapReturn(row: any): ReturnRequest {
  return {
    id: row.id,
    reference: row.reference,
    order_id: row.order_id,
    customer_id: row.customer_id,
    status: row.status,
    reason: row.reason,
    reason_details: row.reason_details,
    resolution: row.resolution,
    refund_amount: toNullableNumber(row.refund_amount),
    admin_notes: row.admin_notes,
    processed_at: row.processed_at,
    created_at: row.created_at,
    items: [],
  }
}

function mapReturnItem(
  row: any,
  orderItem:
    | {
        product_name: string
        product_unit: string
        quantity: number | null
      }
    | null
): ReturnItemDetail {
  return {
    id: row.id,
    return_id: row.return_id,
    order_item_id: row.order_item_id,
    quantity: row.quantity ?? 0,
    reason: row.reason,
    product_name: orderItem?.product_name ?? null,
    product_unit: orderItem?.product_unit ?? null,
    order_item_quantity: orderItem?.quantity ?? null,
  }
}

async function enrichReturnsWithItems(
  supabase: Awaited<ReturnType<typeof createClient>> | Awaited<ReturnType<typeof createServiceClient>>,
  returns: ReturnRequest[]
) {
  const returnIds = returns.map((entry) => entry.id)

  if (returnIds.length === 0) {
    return returns
  }

  const { data: returnItemRows } = await supabase
    .from('return_items')
    .select('*')
    .in('return_id', returnIds)

  const orderItemIds = Array.from(
    new Set((returnItemRows ?? []).map((row) => row.order_item_id).filter(Boolean))
  ) as string[]

  const orderItemsResult =
    orderItemIds.length > 0
      ? await supabase
          .from('order_items')
          .select('id, product_name, product_unit, quantity')
          .in('id', orderItemIds)
      : { data: [] as any[] }

  const orderItemsById = new Map(
    (orderItemsResult.data ?? []).map((item) => [item.id, item])
  )
  const returnItemsByReturnId = new Map<string, ReturnItemDetail[]>()

  for (const row of returnItemRows ?? []) {
    const mappedItem = mapReturnItem(
      row,
      row.order_item_id ? orderItemsById.get(row.order_item_id) ?? null : null
    )

    const bucket = returnItemsByReturnId.get(mappedItem.return_id) ?? []
    bucket.push(mappedItem)
    returnItemsByReturnId.set(mappedItem.return_id, bucket)
  }

  return returns.map((entry) => ({
    ...entry,
    items: returnItemsByReturnId.get(entry.id) ?? [],
  }))
}

export async function getCustomerReturns() {
  if (!env.hasSupabase()) {
    return {
      isConfigured: false,
      isAuthenticated: false,
      returns: [] as ReturnRequest[],
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
      returns: [] as ReturnRequest[],
    }
  }

  const { data } = await supabase
    .from('returns')
    .select('*')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })

  return {
    isConfigured: true,
    isAuthenticated: true,
    returns: await enrichReturnsWithItems(supabase, (data ?? []).map(mapReturn)),
  }
}

export async function getCustomerReturnEligibleOrders() {
  if (!env.hasSupabase()) {
    return {
      isConfigured: false,
      isAuthenticated: false,
      orders: [] as Array<{
        id: string
        reference: string
        delivered_at: string | null
        items: Array<{
          order_item_id: string
          product_name: string
          product_unit: string
          quantity: number
        }>
      }>,
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
      orders: [] as Array<{
        id: string
        reference: string
        delivered_at: string | null
        items: Array<{
          order_item_id: string
          product_name: string
          product_unit: string
          quantity: number
        }>
      }>,
    }
  }

  const { data: orders } = await supabase
    .from('orders')
    .select('id, reference, delivered_at')
    .eq('customer_id', user.id)
    .in('status', ['delivered', 'returned'])
    .order('created_at', { ascending: false })

  const orderIds = (orders ?? []).map((order) => order.id)
  const itemsResult =
    orderIds.length > 0
      ? await supabase
          .from('order_items')
          .select('id, order_id, product_name, product_unit, quantity')
          .in('order_id', orderIds)
      : { data: [] as any[] }

  const itemsByOrderId = new Map<string, Array<{
    order_item_id: string
    product_name: string
    product_unit: string
    quantity: number
  }>>()

  for (const row of itemsResult.data ?? []) {
    const bucket = itemsByOrderId.get(row.order_id) ?? []
    bucket.push({
      order_item_id: row.id,
      product_name: row.product_name,
      product_unit: row.product_unit,
      quantity: row.quantity ?? 0,
    })
    itemsByOrderId.set(row.order_id, bucket)
  }

  return {
    isConfigured: true,
    isAuthenticated: true,
    orders: (orders ?? []).map((order) => ({
      id: order.id,
      reference: order.reference,
      delivered_at: order.delivered_at,
      items: itemsByOrderId.get(order.id) ?? [],
    })),
  }
}

export async function createCustomerReturnRequest(input: {
  orderId: string
  reason: string
  reasonDetails: string | null
  resolution: string | null
  items: Array<{
    orderItemId: string
    quantity: number
  }>
}): Promise<ActionResult<{ id: string }>> {
  try {
    if (!env.hasSupabase()) {
      return { success: false, error: "Supabase n'est pas configure." }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Connexion requise pour demander un retour.' }
    }

    if (!isReturnReason(input.reason)) {
      return { success: false, error: 'Le motif de retour est invalide.' }
    }

    if (input.resolution && !isReturnResolution(input.resolution)) {
      return { success: false, error: 'La resolution souhaitee est invalide.' }
    }

    const orderId = normalizeRequiredText(input.orderId, 'La commande', 80)
    const selectedItems = (Array.isArray(input.items) ? input.items : [])
      .map((item) => ({
        orderItemId: item.orderItemId?.trim() ?? '',
        quantity: Number(item.quantity),
      }))
      .filter((item) => item.orderItemId && Number.isInteger(item.quantity) && item.quantity > 0)

    if (selectedItems.length === 0) {
      return {
        success: false,
        error: 'Selectionnez au moins une ligne produit a retourner.',
      }
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, reference, customer_id, status')
      .eq('id', orderId)
      .eq('customer_id', user.id)
      .maybeSingle()

    if (orderError || !order) {
      throw new Error(
        `Impossible de verifier la commande cible: ${orderError?.message ?? 'introuvable'}`
      )
    }

    if (!['delivered', 'returned'].includes(order.status)) {
      return {
        success: false,
        error: 'Seules les commandes livrees peuvent faire l objet d un retour.',
      }
    }

    const { data: existingOpenReturn } = await supabase
      .from('returns')
      .select('id')
      .eq('order_id', orderId)
      .eq('customer_id', user.id)
      .in('status', ['pending', 'approved'])
      .maybeSingle()

    if (existingOpenReturn) {
      return {
        success: false,
        error: 'Une demande de retour est deja ouverte pour cette commande.',
      }
    }

    const selectedOrderItemIds = selectedItems.map((item) => item.orderItemId)
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select('id, quantity')
      .eq('order_id', orderId)
      .in('id', selectedOrderItemIds)

    if (orderItemsError) {
      throw new Error(
        `Impossible de verifier les lignes retournees: ${orderItemsError.message}`
      )
    }

    const orderItemsById = new Map((orderItems ?? []).map((item) => [item.id, item]))

    for (const item of selectedItems) {
      const orderItem = orderItemsById.get(item.orderItemId)

      if (!orderItem) {
        return {
          success: false,
          error: 'Une ligne retournee ne correspond pas a cette commande.',
        }
      }

      if (item.quantity > (orderItem.quantity ?? 0)) {
        return {
          success: false,
          error: 'La quantite retournee depasse la quantite commandee sur au moins une ligne.',
        }
      }
    }

    const { data: createdReturn, error: returnError } = await supabase
      .from('returns')
      .insert({
        order_id: orderId,
        customer_id: user.id,
        reason: input.reason,
        reason_details: normalizeOptionalText(input.reasonDetails, 2000),
        resolution: input.resolution ? input.resolution : null,
      })
      .select('id')
      .single()

    if (returnError || !createdReturn) {
      throw new Error(
        `Impossible de creer la demande de retour: ${returnError?.message ?? 'reponse vide'}`
      )
    }

    const { error: returnItemsError } = await supabase.from('return_items').insert(
      selectedItems.map((item) => ({
        return_id: createdReturn.id,
        order_item_id: item.orderItemId,
        quantity: item.quantity,
        reason: input.reason,
      }))
    )

    if (returnItemsError) {
      await supabase.from('returns').delete().eq('id', createdReturn.id)

      throw new Error(`Impossible de rattacher les lignes du retour: ${returnItemsError.message}`)
    }

    revalidatePath('/account/returns')
    revalidatePath('/account/orders')
    revalidatePath(`/account/orders/${orderId}`)
    revalidatePath('/admin/returns')

    return { success: true, data: { id: createdReturn.id } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Impossible de creer cette demande de retour.',
    }
  }
}

async function getAdminReturnsClient() {
  const context = await requireAdminMutationContext([...returnRoles])

  if (!context.ok) {
    return {
      access: {
        status: 'forbidden' as const,
        staff: null,
      },
      supabase: null as Awaited<ReturnType<typeof createServiceClient>> | null,
    }
  }

  return {
    access: {
      status: 'ready' as const,
      staff: context.staff,
    },
    supabase: context.supabase,
  }
}

export async function getAdminReturns() {
  const { access, supabase } = await getAdminReturnsClient()

  if (!supabase) {
    return {
      access,
      returns: [] as AdminReturnDetail[],
    }
  }

  const [returnsResult, customersResult, ordersResult] = await Promise.all([
    supabase.from('returns').select('*').order('created_at', { ascending: false }),
    supabase.from('customer_profiles').select('id, full_name, email'),
    supabase.from('orders').select('id, reference'),
  ])

  const customersById = new Map(
    (customersResult.data ?? []).map((customer) => [customer.id, customer])
  )
  const ordersById = new Map((ordersResult.data ?? []).map((order) => [order.id, order.reference]))

  return {
    access,
    returns: (returnsResult.data ?? []).map((row) => {
      const mapped = mapReturn(row)
      const customer = mapped.customer_id ? customersById.get(mapped.customer_id) : null

      return {
        ...mapped,
        customer_name: customer?.full_name ?? null,
        customer_email: customer?.email ?? null,
        order_reference: mapped.order_id ? ordersById.get(mapped.order_id) ?? null : null,
        items: [],
      } satisfies AdminReturnDetail
    }),
  }
}

export async function getAdminReturnById(id: string) {
  const { access, supabase } = await getAdminReturnsClient()

  if (!supabase) {
    return {
      access,
      returnRequest: null as AdminReturnDetail | null,
    }
  }

  const { data } = await supabase.from('returns').select('*').eq('id', id).maybeSingle()

  if (!data) {
    return {
      access,
      returnRequest: null,
    }
  }

  const mapped = mapReturn(data)

  const [{ data: customer }, { data: order }, enrichedReturns] = await Promise.all([
    mapped.customer_id
      ? supabase
          .from('customer_profiles')
          .select('full_name, email')
          .eq('id', mapped.customer_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    mapped.order_id
      ? supabase.from('orders').select('reference').eq('id', mapped.order_id).maybeSingle()
      : Promise.resolve({ data: null }),
    enrichReturnsWithItems(supabase, [mapped]),
  ])

  return {
    access,
    returnRequest: {
      ...enrichedReturns[0],
      customer_name: customer?.full_name ?? null,
      customer_email: customer?.email ?? null,
      order_reference: order?.reference ?? null,
      items: enrichedReturns[0]?.items ?? [],
    } satisfies AdminReturnDetail,
  }
}

export async function updateAdminReturn(input: {
  id: string
  status: string
  resolution: string | null
  refundAmount: string | number | null
  adminNotes: string | null
}): Promise<ActionResult<{ id: string }>> {
  try {
    const context = await requireAdminMutationContext([...returnRoles])

    if (!context.ok) {
      return { success: false, error: context.error }
    }

    const id = normalizeRequiredText(input.id, 'Le retour', 80)

    if (!isReturnStatus(input.status)) {
      return { success: false, error: 'Le statut de retour est invalide.' }
    }

    if (input.resolution && !isReturnResolution(input.resolution)) {
      return { success: false, error: 'La resolution est invalide.' }
    }

    const refundAmount = toNullableNumber(input.refundAmount)

    const { error } = await context.supabase
      .from('returns')
      .update({
        status: input.status,
        resolution: input.resolution ? input.resolution : null,
        refund_amount: refundAmount,
        admin_notes: normalizeOptionalText(input.adminNotes, 2000),
        processed_at:
          input.status === 'approved' || input.status === 'rejected' || input.status === 'completed'
            ? new Date().toISOString()
            : null,
      })
      .eq('id', id)

    if (error) {
      throw new Error(`Impossible de mettre a jour ce retour: ${error.message}`)
    }

    await recordAdminActivity({
      supabase: context.supabase,
      staffId: context.staff.id,
      action: 'return.updated',
      entityType: 'return',
      entityId: id,
      summary: `Retour ${id} mis a jour`,
      metadata: {
        status: input.status,
        resolution: input.resolution ?? null,
        refund_amount: refundAmount,
      },
    })

    revalidatePath('/admin/returns')
    revalidatePath(`/admin/returns/${id}`)
    revalidatePath('/account/returns')

    return { success: true, data: { id } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Impossible de mettre a jour ce retour.',
    }
  }
}
