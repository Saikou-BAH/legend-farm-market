'use server'

import { revalidatePath } from 'next/cache'
import {
  recordAdminActivity,
  requireAdminMutationContext,
} from '@/lib/admin-mutations'
import type { ActionResult } from '@/types'

const batchRoles = ['admin', 'manager'] as const

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
