import { computePromotionDiscount } from './utils/promo.ts'
import type {
  CustomerType,
  LoyaltyLevel,
  Promotion,
  PromotionType,
} from '../types/index.ts'

interface PromotionLineInput {
  productId: string
}

interface ResolveCheckoutPromotionsInput {
  promotions: Promotion[]
  promoCode: string | null
  customerType: CustomerType
  customerLevel: LoyaltyLevel
  zoneName: string | null
  subtotal: number
  deliveryFee: number
  lines: PromotionLineInput[]
}

export interface AppliedCheckoutPromotion {
  promotionId: string
  name: string
  code: string | null
  type: PromotionType
  amount: number
}

export interface ResolvedCheckoutPromotions {
  appliedPromotions: AppliedCheckoutPromotion[]
  selectedPromotionIds: string[]
  selectedPromoCode: string | null
  discountAmount: number
  error: string | null
}

interface CheckoutFinancialSummaryInput extends ResolveCheckoutPromotionsInput {
  requestedPoints: number
  availablePoints: number
  pointValue: number
  useAccountCredit: boolean
  availableCreditBalance: number
}

export interface CheckoutFinancialSummary extends ResolvedCheckoutPromotions {
  pointsUsed: number
  pointsPaymentAmount: number
  accountCreditApplied: number
  remainingPaymentAmount: number
  totalAmount: number
}

function roundMoney(value: number) {
  return Number(Math.max(0, value).toFixed(2))
}

function normalizeCode(value: string | null | undefined) {
  const nextValue = value?.trim() ?? ''
  return nextValue ? nextValue.toLowerCase() : null
}

function mapPromotionComputationType(type: PromotionType) {
  if (type === 'free_delivery') {
    return 'free_delivery'
  }

  if (type === 'percentage' || type === 'buy_x_get_y') {
    return 'percentage'
  }

  return 'fixed_amount'
}

function isPromotionUsable(
  promotion: Promotion,
  {
    customerLevel,
    customerType,
    lines,
    now,
    subtotal,
    zoneName,
  }: {
    customerType: CustomerType
    customerLevel: LoyaltyLevel
    zoneName: string | null
    subtotal: number
    lines: PromotionLineInput[]
    now: Date
  }
) {
  if (!promotion.is_active) {
    return false
  }

  const startsAt = new Date(promotion.starts_at)

  if (Number.isNaN(startsAt.getTime()) || startsAt > now) {
    return false
  }

  if (promotion.ends_at) {
    const endsAt = new Date(promotion.ends_at)

    if (!Number.isNaN(endsAt.getTime()) && endsAt < now) {
      return false
    }
  }

  if (promotion.max_uses !== null && promotion.current_uses >= promotion.max_uses) {
    return false
  }

  if (promotion.min_order_amount > 0 && subtotal < promotion.min_order_amount) {
    return false
  }

  if (
    Array.isArray(promotion.customer_types) &&
    promotion.customer_types.length > 0 &&
    !promotion.customer_types.includes(customerType)
  ) {
    return false
  }

  if (
    Array.isArray(promotion.customer_levels) &&
    promotion.customer_levels.length > 0 &&
    !promotion.customer_levels.includes(customerLevel)
  ) {
    return false
  }

  if (
    Array.isArray(promotion.zones) &&
    promotion.zones.length > 0 &&
    zoneName &&
    !promotion.zones.some((zone) => zone.toLowerCase() === zoneName.toLowerCase())
  ) {
    return false
  }

  if (
    Array.isArray(promotion.zones) &&
    promotion.zones.length > 0 &&
    !zoneName
  ) {
    return false
  }

  if (Array.isArray(promotion.product_ids) && promotion.product_ids.length > 0) {
    const lineProductIds = new Set(lines.map((line) => line.productId))

    if (!promotion.product_ids.some((productId) => lineProductIds.has(productId))) {
      return false
    }
  }

  return true
}

function applyPromotionSequence(promotions: Promotion[], subtotal: number, deliveryFee: number) {
  let remainingSubtotal = subtotal
  let remainingDeliveryFee = deliveryFee

  const sortedPromotions = [...promotions].sort((left, right) => {
    const priority = (type: PromotionType) => {
      if (type === 'percentage' || type === 'buy_x_get_y') {
        return 0
      }

      if (type === 'fixed_amount' || type === 'bundle') {
        return 1
      }

      return 2
    }

    return priority(left.type) - priority(right.type)
  })

  const appliedPromotions: AppliedCheckoutPromotion[] = []

  for (const promotion of sortedPromotions) {
    const amount = roundMoney(
      computePromotionDiscount({
        deliveryFee: remainingDeliveryFee,
        subtotal: remainingSubtotal,
        type: mapPromotionComputationType(promotion.type),
        value: promotion.value,
      })
    )

    if (amount <= 0) {
      continue
    }

    if (promotion.type === 'free_delivery') {
      remainingDeliveryFee = roundMoney(remainingDeliveryFee - amount)
    } else {
      remainingSubtotal = roundMoney(remainingSubtotal - amount)
    }

    appliedPromotions.push({
      promotionId: promotion.id,
      name: promotion.name,
      code: promotion.code,
      type: promotion.type,
      amount,
    })
  }

  return {
    appliedPromotions,
    discountAmount: roundMoney(
      appliedPromotions.reduce((total, promotion) => total + promotion.amount, 0)
    ),
  }
}

export function resolveCheckoutPromotions(
  input: ResolveCheckoutPromotionsInput
): ResolvedCheckoutPromotions {
  const normalizedPromoCode = normalizeCode(input.promoCode)
  const now = new Date()

  const eligiblePromotions = input.promotions.filter((promotion) =>
    isPromotionUsable(promotion, {
      customerType: input.customerType,
      customerLevel: input.customerLevel,
      zoneName: input.zoneName,
      subtotal: input.subtotal,
      lines: input.lines,
      now,
    })
  )

  const automaticPromotions = eligiblePromotions.filter((promotion) => !normalizeCode(promotion.code))

  let manualPromotion: Promotion | null = null

  if (normalizedPromoCode) {
    manualPromotion =
      eligiblePromotions.find(
        (promotion) => normalizeCode(promotion.code) === normalizedPromoCode
      ) ?? null

    if (!manualPromotion) {
      return {
        appliedPromotions: [],
        selectedPromotionIds: [],
        selectedPromoCode: null,
        discountAmount: 0,
        error: 'Le code promo est introuvable ou non applicable a ce panier.',
      }
    }
  }

  let selectedPromotions: Promotion[] = []

  if (manualPromotion) {
    selectedPromotions = manualPromotion.is_cumulative
      ? [
          manualPromotion,
          ...automaticPromotions.filter(
            (promotion) => promotion.id !== manualPromotion.id && promotion.is_cumulative
          ),
        ]
      : [manualPromotion]
  } else {
    const cumulativePromotions = automaticPromotions.filter((promotion) => promotion.is_cumulative)
    const bestStandalonePromotion =
      automaticPromotions
        .filter((promotion) => !promotion.is_cumulative)
        .map((promotion) => ({
          promotion,
          result: applyPromotionSequence([promotion], input.subtotal, input.deliveryFee),
        }))
        .sort((left, right) => right.result.discountAmount - left.result.discountAmount)[0] ?? null

    const cumulativeResult = applyPromotionSequence(
      cumulativePromotions,
      input.subtotal,
      input.deliveryFee
    )

    if (
      bestStandalonePromotion &&
      bestStandalonePromotion.result.discountAmount > cumulativeResult.discountAmount
    ) {
      selectedPromotions = [bestStandalonePromotion.promotion]
    } else {
      selectedPromotions = cumulativePromotions
    }
  }

  const result = applyPromotionSequence(selectedPromotions, input.subtotal, input.deliveryFee)

  return {
    ...result,
    selectedPromotionIds: selectedPromotions.map((promotion) => promotion.id),
    selectedPromoCode: manualPromotion?.code ?? null,
    error: null,
  }
}

export function getCheckoutFinancialSummary(
  input: CheckoutFinancialSummaryInput
): CheckoutFinancialSummary {
  const promotionResult = resolveCheckoutPromotions(input)
  const totalAfterPromotions = roundMoney(
    input.subtotal + input.deliveryFee - promotionResult.discountAmount
  )
  const safePointValue = input.pointValue > 0 ? input.pointValue : 1
  const maxRedeemablePoints = Math.max(
    0,
    Math.min(input.availablePoints, Math.floor(totalAfterPromotions / safePointValue))
  )
  const requestedPoints = Number.isInteger(input.requestedPoints)
    ? input.requestedPoints
    : Math.floor(input.requestedPoints)
  const pointsUsed = Math.max(0, Math.min(maxRedeemablePoints, requestedPoints))
  const pointsPaymentAmount = roundMoney(pointsUsed * safePointValue)
  const accountCreditApplied = input.useAccountCredit
    ? roundMoney(
        Math.min(
          Math.max(0, input.availableCreditBalance),
          Math.max(0, totalAfterPromotions - pointsPaymentAmount)
        )
      )
    : 0

  return {
    ...promotionResult,
    totalAmount: totalAfterPromotions,
    pointsUsed,
    pointsPaymentAmount,
    accountCreditApplied,
    remainingPaymentAmount: roundMoney(
      totalAfterPromotions - pointsPaymentAmount - accountCreditApplied
    ),
  }
}
