'use server'

import { revalidatePath } from 'next/cache'
import {
  recordAdminActivity,
  requireAdminMutationContext,
} from '@/lib/admin-mutations'
import { env } from '@/lib/env'
import { createServiceClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'

const batchRoles = ['admin', 'manager'] as const

// ── Types publics ──────────────────────────────────────────────────────────────

export interface AdminBatch {
  id: string
  name: string
  product_id: string
  product_name: string
  batch_date: string
  initial_quantity: number
  remaining_quantity: number
  status: string
}

// ── Lecture : bandes actives ───────────────────────────────────────────────────

export async function getAdminActiveBatches(): Promise<AdminBatch[]> {
  if (!env.hasSupabase() || !env.hasServiceRole()) return []

  const supabase = await createServiceClient()

  const { data } = await supabase
    .from('flock_batches')
    .select('id, name, product_id, batch_date, initial_quantity, remaining_quantity, status, products(name)')
    .eq('status', 'active')
    .order('batch_date', { ascending: false })

  if (!data) return []

  return data.map((b: any) => ({
    id: b.id,
    name: b.name,
    product_id: b.product_id,
    product_name: b.products?.name ?? '—',
    batch_date: b.batch_date,
    initial_quantity: Number(b.initial_quantity),
    remaining_quantity: Number(b.remaining_quantity),
    status: b.status,
  }))
}

interface CreateFlockBatchInput {
  productId: string
  name: string
  batchDate: string
  initialQuantity: string | number
  costPerUnit?: string | number | null
  notes?: string | null
}

export async function createFlockBatch(
  input: CreateFlockBatchInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const context = await requireAdminMutationContext([...batchRoles])

    if (!context.ok) {
      return { success: false, error: context.error }
    }

    const productId = input.productId?.trim()
    if (!productId) {
      return { success: false, error: 'Le produit est obligatoire.' }
    }

    const name = input.name?.trim()
    if (!name || name.length < 2) {
      return { success: false, error: 'Le nom de la bande est obligatoire.' }
    }

    if (!input.batchDate) {
      return { success: false, error: 'La date de la bande est obligatoire.' }
    }

    const initialQuantity = Number(input.initialQuantity)
    if (!Number.isInteger(initialQuantity) || initialQuantity < 1) {
      return { success: false, error: 'La quantité initiale doit être un entier positif.' }
    }

    const costPerUnit =
      input.costPerUnit != null && input.costPerUnit !== ''
        ? Number(input.costPerUnit)
        : null

    if (costPerUnit !== null && (!Number.isFinite(costPerUnit) || costPerUnit < 0)) {
      return { success: false, error: 'Le coût unitaire est invalide.' }
    }

    const notes = input.notes?.trim() || null

    const { data, error } = await context.supabase
      .from('flock_batches')
      .insert({
        product_id: productId,
        name: name.slice(0, 120),
        batch_date: input.batchDate,
        initial_quantity: initialQuantity,
        remaining_quantity: initialQuantity,
        cost_per_unit: costPerUnit,
        notes: notes?.slice(0, 500) ?? null,
        status: 'active',
      })
      .select('id')
      .single()

    if (error || !data) {
      throw new Error(`Impossible de créer la bande : ${error?.message ?? 'réponse vide'}`)
    }

    await recordAdminActivity({
      supabase: context.supabase,
      staffId: context.staff.id,
      action: 'flock_batch.created',
      entityType: 'flock_batch',
      entityId: data.id,
      summary: `Bande créée : ${name}`,
      metadata: { product_id: productId, initial_quantity: initialQuantity },
    })

    revalidatePath('/admin/batches')
    revalidatePath('/admin/stats')

    return { success: true, data: { id: data.id } }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Impossible de créer la bande.',
    }
  }
}

// ── Mutation : entrée de stock ─────────────────────────────────────────────────

interface CreateStockEntryInput {
  flockBatchId: string
  quantity: string | number
  unitCost?: string | number | null
  notes?: string | null
}

export async function createStockEntry(
  input: CreateStockEntryInput
): Promise<ActionResult<{ id: string; productId: string; quantityAdded: number }>> {
  try {
    const context = await requireAdminMutationContext([...batchRoles])
    if (!context.ok) return { success: false, error: context.error }

    const flockBatchId = input.flockBatchId?.trim()
    if (!flockBatchId) return { success: false, error: 'La bande est obligatoire.' }

    const quantity = Number(input.quantity)
    if (!Number.isInteger(quantity) || quantity < 1) {
      return { success: false, error: 'La quantité doit être un entier positif.' }
    }

    const unitCost =
      input.unitCost != null && input.unitCost !== ''
        ? Number(input.unitCost)
        : null
    if (unitCost !== null && (!Number.isFinite(unitCost) || unitCost < 0)) {
      return { success: false, error: 'Le coût unitaire est invalide.' }
    }

    // Vérifier que la bande existe et récupérer le product_id
    const { data: batch, error: batchError } = await context.supabase
      .from('flock_batches')
      .select('id, product_id, name, initial_quantity, remaining_quantity')
      .eq('id', flockBatchId)
      .maybeSingle()

    if (batchError || !batch) {
      return { success: false, error: 'Bande introuvable.' }
    }

    // Créer l'entrée de stock
    const { data: entry, error: entryError } = await context.supabase
      .from('stock_entries')
      .insert({
        product_id: batch.product_id,
        flock_batch_id: flockBatchId,
        quantity,
        remaining_qty: quantity,
        unit_cost: unitCost,
        notes: input.notes?.trim().slice(0, 500) || null,
        entered_by: context.staff.id,
      })
      .select('id')
      .single()

    if (entryError || !entry) {
      throw new Error(`Impossible de créer l'entrée de stock : ${entryError?.message ?? 'réponse vide'}`)
    }

    // Mettre à jour la bande : initial_quantity et remaining_quantity += quantity
    const { error: batchUpdateError } = await context.supabase
      .from('flock_batches')
      .update({
        initial_quantity: Number(batch.initial_quantity) + quantity,
        remaining_quantity: Number(batch.remaining_quantity) + quantity,
      })
      .eq('id', flockBatchId)

    if (batchUpdateError) {
      throw new Error(`Entrée créée mais la bande n'a pas pu être mise à jour : ${batchUpdateError.message}`)
    }

    // Mettre à jour le stock produit (lecture puis écriture atomique)
    const { data: prod } = await context.supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', batch.product_id)
      .maybeSingle()

    if (prod) {
      await context.supabase
        .from('products')
        .update({ stock_quantity: Number(prod.stock_quantity) + quantity })
        .eq('id', batch.product_id)
    }

    await recordAdminActivity({
      supabase: context.supabase,
      staffId: context.staff.id,
      action: 'stock_entry.created',
      entityType: 'stock_entry',
      entityId: entry.id,
      summary: `Entrée stock : +${quantity} unités → bande "${batch.name}"`,
      metadata: {
        flock_batch_id: flockBatchId,
        product_id: batch.product_id,
        quantity,
        unit_cost: unitCost,
      },
    })

    revalidatePath('/admin/batches')
    revalidatePath('/admin/stats')
    revalidatePath('/admin/products')

    return {
      success: true,
      data: { id: entry.id, productId: batch.product_id, quantityAdded: quantity },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Impossible de créer l'entrée de stock.",
    }
  }
}
