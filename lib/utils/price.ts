interface PriceTier {
  quantity: number | null
  price: number | null
}

export interface TieredPriceInput {
  basePrice: number
  quantity: number
  tiers: [PriceTier, PriceTier, PriceTier]
}

export function getTieredUnitPrice({
  basePrice,
  quantity,
  tiers,
}: TieredPriceInput) {
  const sortedTiers = tiers
    .filter((tier) => tier.quantity && tier.price !== null)
    .sort((a, b) => (a.quantity ?? 0) - (b.quantity ?? 0))

  let unitPrice = basePrice

  for (const tier of sortedTiers) {
    if ((tier.quantity ?? 0) <= quantity && tier.price !== null) {
      unitPrice = tier.price
    }
  }

  return unitPrice
}

export function getLineTotal(unitPrice: number, quantity: number) {
  return unitPrice * quantity
}
