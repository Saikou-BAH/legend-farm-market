'use server'

import { revalidatePath } from 'next/cache'
import {
  recordAdminActivity,
  requireAdminMutationContext,
} from '@/lib/admin-mutations'
import type {
  ActionResult,
  CustomerType,
  LoyaltyLevel,
  PromotionType,
} from '@/types'

const promotionRoles = ['admin', 'manager'] as const
const promotionTypes: PromotionType[] = [
  'percentage',
  'fixed_amount',
  'free_delivery',
  'buy_x_get_y',
  'bundle',
]
const customerTypes: CustomerType[] = [
  'individual',
  'retailer',
  'restaurant',
  'wholesaler',
  'hotel',
]
const customerLevels: LoyaltyLevel[] = ['bronze', 'silver', 'gold', 'platinum']
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

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

function parseMoney(value: string | number | null | undefined, label: string) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} est invalide.`)
  }

  return Number(parsed.toFixed(2))
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

function parseDateTime(value: string | null | undefined, label: string, required = false) {
  const nextValue = value?.trim() ?? ''

  if (!nextValue) {
    if (required) {
      throw new Error(`${label} est obligatoire.`)
    }

    return null
  }

  const date = new Date(nextValue)

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${label} est invalide.`)
  }

  return date.toISOString()
}

function parseCsvList(value: string | null | undefined) {
  const nextValue = value?.trim() ?? ''

  if (!nextValue) {
    return null
  }

  const items = nextValue
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  return items.length > 0 ? Array.from(new Set(items)) : null
}

function parseEnumCsvList<T extends string>(
  value: string | null | undefined,
  allowedValues: readonly T[],
  label: string
) {
  const parsed = parseCsvList(value)

  if (!parsed) {
    return null
  }

  const invalidValue = parsed.find((item) => !allowedValues.includes(item as T))

  if (invalidValue) {
    throw new Error(`${label} contient une valeur invalide: ${invalidValue}.`)
  }

  return parsed as T[]
}

function parseUuidCsvList(value: string | null | undefined, label: string) {
  const parsed = parseCsvList(value)

  if (!parsed) {
    return null
  }

  const invalidValue = parsed.find((item) => !uuidPattern.test(item))

  if (invalidValue) {
    throw new Error(`${label} contient un identifiant invalide: ${invalidValue}.`)
  }

  return parsed
}

function revalidatePromotionPaths(promotionId?: string) {
  revalidatePath('/')
  revalidatePath('/products')
  revalidatePath('/cart')
  revalidatePath('/checkout')
  revalidatePath('/admin/promotions')

  if (promotionId) {
    revalidatePath(`/admin/promotions/${promotionId}`)
  }
}

interface PromotionPayload {
  name: string
  description: string | null
  type: PromotionType
  code: string | null
  value: string | number
  minOrderAmount: string | number
  maxUses: string | number | null
  maxUsesPerCustomer: string | number
  startsAt: string
  endsAt: string | null
  isActive: boolean
  isCumulative: boolean
  customerTypesCsv: string | null
  customerLevelsCsv: string | null
  productIdsCsv: string | null
  zonesCsv: string | null
}

function buildPromotionMutation(input: PromotionPayload) {
  if (!promotionTypes.includes(input.type)) {
    throw new Error('Le type de promotion est invalide.')
  }

  return {
    name: normalizeRequiredText(input.name, 'Le nom de la promotion', 140),
    description: normalizeOptionalText(input.description, 2000),
    type: input.type,
    code: normalizeOptionalText(input.code, 80),
    value: parseMoney(input.value, 'La valeur de la promotion'),
    min_order_amount: parseMoney(input.minOrderAmount, 'Le minimum de commande'),
    max_uses: parseInteger(input.maxUses, "Le nombre maximal d'utilisations", {
      allowNull: true,
      min: 0,
    }),
    max_uses_per_customer: parseInteger(
      input.maxUsesPerCustomer,
      'Le maximum par client',
      { min: 0 }
    ),
    customer_types: parseEnumCsvList(
      input.customerTypesCsv,
      customerTypes,
      'Les types de clients'
    ),
    customer_levels: parseEnumCsvList(
      input.customerLevelsCsv,
      customerLevels,
      'Les niveaux de fidelite'
    ),
    product_ids: parseUuidCsvList(input.productIdsCsv, 'Les produits cibles'),
    zones: parseCsvList(input.zonesCsv),
    starts_at: parseDateTime(input.startsAt, 'La date de debut', true),
    ends_at: parseDateTime(input.endsAt, 'La date de fin'),
    is_active: input.isActive,
    is_cumulative: input.isCumulative,
  }
}

export async function createAdminPromotion(
  input: PromotionPayload
): Promise<ActionResult<{ id: string }>> {
  try {
    const context = await requireAdminMutationContext([...promotionRoles])

    if (!context.ok) {
      return {
        success: false,
        error: context.error,
      }
    }

    const payload = buildPromotionMutation(input)

    const { data, error } = await context.supabase
      .from('promotions')
      .insert(payload)
      .select('id')
      .single()

    if (error || !data) {
      throw new Error(
        `Impossible de creer la promotion: ${error?.message ?? 'reponse vide'}`
      )
    }

    await recordAdminActivity({
      supabase: context.supabase,
      staffId: context.staff.id,
      action: 'promotion.created',
      entityType: 'promotion',
      entityId: data.id,
      summary: `Promotion creee: ${payload.name}`,
      metadata: {
        type: payload.type,
        code: payload.code,
        is_active: payload.is_active,
      },
    })

    revalidatePromotionPaths(data.id)

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
        error instanceof Error
          ? error.message
          : 'Impossible de creer la promotion.',
    }
  }
}

export async function updateAdminPromotion(
  id: string,
  input: PromotionPayload
): Promise<ActionResult<{ id: string }>> {
  try {
    const context = await requireAdminMutationContext([...promotionRoles])

    if (!context.ok) {
      return {
        success: false,
        error: context.error,
      }
    }

    const promotionId = id.trim()

    if (!promotionId) {
      return {
        success: false,
        error: 'La promotion cible est invalide.',
      }
    }

    const payload = buildPromotionMutation(input)

    const { error } = await context.supabase
      .from('promotions')
      .update(payload)
      .eq('id', promotionId)

    if (error) {
      throw new Error(`Impossible de mettre a jour la promotion: ${error.message}`)
    }

    await recordAdminActivity({
      supabase: context.supabase,
      staffId: context.staff.id,
      action: 'promotion.updated',
      entityType: 'promotion',
      entityId: promotionId,
      summary: `Promotion mise a jour: ${payload.name}`,
      metadata: {
        type: payload.type,
        code: payload.code,
        is_active: payload.is_active,
      },
    })

    revalidatePromotionPaths(promotionId)

    return {
      success: true,
      data: {
        id: promotionId,
      },
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Impossible de mettre a jour la promotion.',
    }
  }
}
