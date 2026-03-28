'use server'

import { revalidatePath } from 'next/cache'
import {
  recordAdminActivity,
  requireAdminMutationContext,
} from '@/lib/admin-mutations'
import type { ActionResult } from '@/types'

const productRoles = ['admin', 'manager'] as const

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

function parseInteger(
  value: string | number | null | undefined,
  label: string,
  { allowNull = false, min = 0 }: { allowNull?: boolean; min?: number } = {}
) {
  if (value === null || value === undefined || value === '') {
    if (allowNull) {
      return null
    }

    throw new Error(`${label} est obligatoire.`)
  }

  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed < min) {
    throw new Error(`${label} est invalide.`)
  }

  return parsed
}

function parseMoney(
  value: string | number | null | undefined,
  label: string,
  { allowNull = false }: { allowNull?: boolean } = {}
) {
  if (value === null || value === undefined || value === '') {
    if (allowNull) {
      return null
    }

    throw new Error(`${label} est obligatoire.`)
  }

  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} est invalide.`)
  }

  return Number(parsed.toFixed(2))
}

function validateTier(quantity: number | null, price: number | null, label: string) {
  if ((quantity === null) !== (price === null)) {
    throw new Error(`${label} doit definir une quantite et un prix ensemble.`)
  }
}

function revalidateAdminProductPaths(productId?: string) {
  revalidatePath('/')
  revalidatePath('/products')
  revalidatePath('/admin/products')

  if (productId) {
    revalidatePath(`/products/${productId}`)
    revalidatePath(`/admin/products/${productId}`)
  }
}

type AvailabilityStatus = 'available' | 'out_of_stock' | 'unavailable' | 'coming_soon'

interface ProductPayload {
  name: string
  description: string | null
  category: string
  unit: string
  basePrice: string | number
  priceTier1Qty: string | number | null
  priceTier1Price: string | number | null
  priceTier2Qty: string | number | null
  priceTier2Price: string | number | null
  priceTier3Qty: string | number | null
  priceTier3Price: string | number | null
  stockQuantity: string | number
  stockAlertThreshold: string | number
  isAvailable: boolean
  isFeatured: boolean
  sortOrder: string | number
  availabilityStatus?: AvailabilityStatus
  availabilityLabel?: string | null
  restockNote?: string | null
}

function buildProductMutation(input: ProductPayload) {
  const priceTier1Qty = parseInteger(input.priceTier1Qty, 'La quantite du palier 1', {
    allowNull: true,
    min: 1,
  })
  const priceTier1Price = parseMoney(input.priceTier1Price, 'Le prix du palier 1', {
    allowNull: true,
  })
  const priceTier2Qty = parseInteger(input.priceTier2Qty, 'La quantite du palier 2', {
    allowNull: true,
    min: 1,
  })
  const priceTier2Price = parseMoney(input.priceTier2Price, 'Le prix du palier 2', {
    allowNull: true,
  })
  const priceTier3Qty = parseInteger(input.priceTier3Qty, 'La quantite du palier 3', {
    allowNull: true,
    min: 1,
  })
  const priceTier3Price = parseMoney(input.priceTier3Price, 'Le prix du palier 3', {
    allowNull: true,
  })

  validateTier(priceTier1Qty, priceTier1Price, 'Le palier 1')
  validateTier(priceTier2Qty, priceTier2Price, 'Le palier 2')
  validateTier(priceTier3Qty, priceTier3Price, 'Le palier 3')

  return {
    name: normalizeRequiredText(input.name, 'Le nom du produit', 140),
    description: normalizeOptionalText(input.description, 4000),
    category: normalizeRequiredText(input.category, 'La categorie', 80),
    unit: normalizeRequiredText(input.unit, "L'unite", 40),
    base_price: parseMoney(input.basePrice, 'Le prix de base'),
    price_tier_1_qty: priceTier1Qty,
    price_tier_1_price: priceTier1Price,
    price_tier_2_qty: priceTier2Qty,
    price_tier_2_price: priceTier2Price,
    price_tier_3_qty: priceTier3Qty,
    price_tier_3_price: priceTier3Price,
    stock_quantity: parseInteger(input.stockQuantity, 'Le stock', { min: 0 }),
    stock_alert_threshold: parseInteger(
      input.stockAlertThreshold,
      "Le seuil d'alerte",
      { min: 0 }
    ),
    is_available: input.isAvailable,
    is_featured: input.isFeatured,
    sort_order: parseInteger(input.sortOrder, "L'ordre d'affichage", { min: 0 }),
    availability_status: input.availabilityStatus ?? 'available',
    availability_label: normalizeOptionalText(input.availabilityLabel, 60),
    restock_note: normalizeOptionalText(input.restockNote, 120),
  }
}

export async function createAdminProduct(
  input: ProductPayload
): Promise<ActionResult<{ id: string }>> {
  try {
    const context = await requireAdminMutationContext([...productRoles])

    if (!context.ok) {
      return {
        success: false,
        error: context.error,
      }
    }

    const payload = {
      ...buildProductMutation(input),
      images: [],
    }

    const { data, error } = await context.supabase
      .from('products')
      .insert(payload)
      .select('id')
      .single()

    if (error || !data) {
      throw new Error(`Impossible de creer le produit: ${error?.message ?? 'reponse vide'}`)
    }

    await recordAdminActivity({
      supabase: context.supabase,
      staffId: context.staff.id,
      action: 'product.created',
      entityType: 'product',
      entityId: data.id,
      summary: `Produit cree: ${payload.name}`,
      metadata: {
        category: payload.category,
        is_available: payload.is_available,
      },
    })

    revalidateAdminProductPaths(data.id)

    return {
      success: true,
      data: {
        id: data.id,
      },
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Impossible de creer le produit.',
    }
  }
}

export async function updateAdminProduct(
  id: string,
  input: ProductPayload
): Promise<ActionResult<{ id: string }>> {
  try {
    const context = await requireAdminMutationContext([...productRoles])

    if (!context.ok) {
      return {
        success: false,
        error: context.error,
      }
    }

    const productId = id.trim()

    if (!productId) {
      return {
        success: false,
        error: 'Le produit cible est invalide.',
      }
    }

    const payload = buildProductMutation(input)

    const { error } = await context.supabase
      .from('products')
      .update(payload)
      .eq('id', productId)

    if (error) {
      throw new Error(`Impossible de mettre a jour le produit: ${error.message}`)
    }

    await recordAdminActivity({
      supabase: context.supabase,
      staffId: context.staff.id,
      action: 'product.updated',
      entityType: 'product',
      entityId: productId,
      summary: `Produit mis a jour: ${payload.name}`,
      metadata: {
        category: payload.category,
        is_available: payload.is_available,
        is_featured: payload.is_featured,
      },
    })

    revalidateAdminProductPaths(productId)

    return {
      success: true,
      data: {
        id: productId,
      },
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Impossible de mettre a jour le produit.',
    }
  }
}
