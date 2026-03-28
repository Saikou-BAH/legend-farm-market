export interface PromoComputationInput {
  subtotal: number
  type: 'percentage' | 'fixed_amount' | 'free_delivery'
  value: number
  deliveryFee: number
}

export function computePromotionDiscount({
  deliveryFee,
  subtotal,
  type,
  value,
}: PromoComputationInput) {
  if (type === 'percentage') {
    return subtotal * (value / 100)
  }

  if (type === 'fixed_amount') {
    return Math.min(value, subtotal)
  }

  if (type === 'free_delivery') {
    return deliveryFee
  }

  return 0
}
