import type { AvailabilityStatus, Product } from '@/types'

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

/**
 * Prix minimum en GNF pour un affichage public.
 * En dessous de ce seuil le prix affiche est remplace par "Prix à confirmer"
 * pour eviter qu un prix de test ou mal saisi soit visible publiquement.
 */
export const MIN_DISPLAYABLE_PRICE_GNF = 500

export function isDisplayablePrice(price: number) {
  return price >= MIN_DISPLAYABLE_PRICE_GNF
}

export interface AvailabilityConfig {
  /** Statut final résolu */
  status: AvailabilityStatus
  /** Label court affiché dans les badges */
  label: string
  /** Variant Badge */
  variant: 'default' | 'secondary' | 'outline'
  /** Le produit peut être ajouté au panier */
  purchasable: boolean
  /** Libellé bouton panier quand non commandable */
  buttonLabel: string
  /** Classes CSS pour le badge sur image (overlay) */
  overlayClasses: string | null
}

/**
 * Derives display config from the product's availability_status, with a
 * fallback to is_available / stock_quantity for backwards compatibility.
 */
export function resolveAvailabilityStatus(
  product: Pick<
    Product,
    | 'is_available'
    | 'stock_quantity'
    | 'stock_alert_threshold'
    | 'availability_status'
    | 'availability_label'
  >
): AvailabilityConfig {
  // Explicit status set by admin takes full precedence
  const status = product.availability_status

  if (status === 'out_of_stock') {
    return {
      status,
      label: product.availability_label ?? 'Épuisé',
      variant: 'outline',
      purchasable: false,
      buttonLabel: 'Épuisé',
      overlayClasses: 'bg-neutral-900/50',
    }
  }

  if (status === 'unavailable') {
    return {
      status,
      label: product.availability_label ?? 'Indisponible',
      variant: 'outline',
      purchasable: false,
      buttonLabel: 'Non disponible',
      overlayClasses: 'bg-neutral-900/50',
    }
  }

  if (status === 'coming_soon') {
    return {
      status,
      label: product.availability_label ?? 'Bientôt disponible',
      variant: 'secondary',
      purchasable: false,
      buttonLabel: 'Bientôt disponible',
      overlayClasses: 'bg-primary/30',
    }
  }

  // status === 'available' — check real stock
  if (product.stock_quantity <= 0) {
    return {
      status: 'out_of_stock',
      label: 'Épuisé',
      variant: 'outline',
      purchasable: false,
      buttonLabel: 'Épuisé',
      overlayClasses: 'bg-neutral-900/50',
    }
  }

  if (product.stock_quantity <= Math.max(product.stock_alert_threshold, 5)) {
    return {
      status: 'available',
      label: 'Stock limité',
      variant: 'secondary',
      purchasable: true,
      buttonLabel: 'Ajouter',
      overlayClasses: null,
    }
  }

  return {
    status: 'available',
    label: 'Disponible',
    variant: 'default',
    purchasable: true,
    buttonLabel: 'Ajouter',
    overlayClasses: null,
  }
}

/** @deprecated Use resolveAvailabilityStatus */
export function getProductAvailability(
  product: Pick<
    Product,
    | 'is_available'
    | 'stock_quantity'
    | 'stock_alert_threshold'
    | 'availability_status'
    | 'availability_label'
  >
) {
  const config = resolveAvailabilityStatus(product)
  return {
    label: config.label,
    variant: config.variant,
    description: config.purchasable
      ? 'Produit disponible a la vente.'
      : 'Ce produit n est pas commandable actuellement.',
  }
}
