import type { Product } from '@/types'

export interface CatalogFilters {
  search?: string | null
  category?: string | null
}

export interface ProductPriceTier {
  quantity: number
  price: number
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function normalizeCatalogFilter(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const normalized = value.trim()

  return normalized === '' ? null : normalized
}

export function getProductPrimaryImage(product: Pick<Product, 'images'>) {
  return (
    product.images.find((image) => typeof image === 'string' && image.trim() !== '') ?? null
  )
}

export function getProductPriceTiers(
  product: Pick<
    Product,
    | 'price_tier_1_qty'
    | 'price_tier_1_price'
    | 'price_tier_2_qty'
    | 'price_tier_2_price'
    | 'price_tier_3_qty'
    | 'price_tier_3_price'
  >
) {
  const tiers: ProductPriceTier[] = []

  if (product.price_tier_1_qty && product.price_tier_1_price !== null) {
    tiers.push({
      quantity: product.price_tier_1_qty,
      price: product.price_tier_1_price,
    })
  }

  if (product.price_tier_2_qty && product.price_tier_2_price !== null) {
    tiers.push({
      quantity: product.price_tier_2_qty,
      price: product.price_tier_2_price,
    })
  }

  if (product.price_tier_3_qty && product.price_tier_3_price !== null) {
    tiers.push({
      quantity: product.price_tier_3_qty,
      price: product.price_tier_3_price,
    })
  }

  return tiers.sort((left, right) => left.quantity - right.quantity)
}

export function getProductStartingPrice(
  product: Pick<
    Product,
    | 'base_price'
    | 'price_tier_1_qty'
    | 'price_tier_1_price'
    | 'price_tier_2_qty'
    | 'price_tier_2_price'
    | 'price_tier_3_qty'
    | 'price_tier_3_price'
  >
) {
  const tierPrices = getProductPriceTiers(product).map((tier) => tier.price)

  return Math.min(product.base_price, ...tierPrices)
}

export function getCatalogCategories(products: Product[]) {
  return Array.from(
    new Set(products.map((product) => product.category.trim()).filter(Boolean))
  ).sort((left, right) => left.localeCompare(right, 'fr'))
}

export function filterCatalogProducts(products: Product[], filters: CatalogFilters) {
  const normalizedSearch = normalizeCatalogFilter(filters.search)
  const normalizedCategory = normalizeCatalogFilter(filters.category)

  return products.filter((product) => {
    const categoryMatches =
      !normalizedCategory ||
      normalizeText(product.category) === normalizeText(normalizedCategory)

    if (!categoryMatches) {
      return false
    }

    if (!normalizedSearch) {
      return true
    }

    const searchableText = normalizeText(
      [product.name, product.category, product.unit, product.description ?? ''].join(' ')
    )

    return searchableText.includes(normalizeText(normalizedSearch))
  })
}

export function getProductAvailability(
  product: Pick<Product, 'is_available' | 'stock_quantity' | 'stock_alert_threshold'>
) {
  if (!product.is_available) {
    return {
      label: 'Indisponible',
      variant: 'outline' as const,
      description: 'Ce produit n est pas actuellement ouvert a la vente.',
    }
  }

  if (product.stock_quantity <= 0) {
    return {
      label: 'Stock a confirmer',
      variant: 'outline' as const,
      description: 'La disponibilite doit etre revalidee par l equipe de la ferme.',
    }
  }

  if (product.stock_quantity <= Math.max(product.stock_alert_threshold, 5)) {
    return {
      label: 'Stock limite',
      variant: 'secondary' as const,
      description: 'Le produit est disponible mais les quantites deviennent limitees.',
    }
  }

  return {
    label: 'Disponible',
    variant: 'default' as const,
    description: 'Produit disponible a la vente avec une disponibilite confirmee.',
  }
}
