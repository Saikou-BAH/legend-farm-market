import { getLineTotal, getTieredUnitPrice } from '@/lib/utils/price'
import type { Product } from '@/types'

export interface CartItem {
  product: Product
  quantity: number
  added_at: string
  updated_at: string
}

export interface CartMutationResult {
  success: boolean
  message: string
}

export interface CartItemValidation {
  status: 'valid' | 'warning' | 'invalid'
  message: string
}

export interface CartSummary {
  lineCount: number
  totalQuantity: number
  subtotal: number
  invalidLineCount: number
  warningLineCount: number
}

export const CART_STORAGE_KEY = 'legend-farm-shop-cart'

export function clampCartQuantity(quantity: number) {
  if (!Number.isFinite(quantity)) {
    return 1
  }

  return Math.max(1, Math.trunc(quantity))
}

export function isProductPurchasable(product: Pick<Product, 'is_available' | 'stock_quantity'>) {
  return product.is_available && product.stock_quantity > 0
}

export function getCartItemUnitPrice(item: CartItem) {
  return getTieredUnitPrice({
    basePrice: item.product.base_price,
    quantity: item.quantity,
    tiers: [
      {
        quantity: item.product.price_tier_1_qty,
        price: item.product.price_tier_1_price,
      },
      {
        quantity: item.product.price_tier_2_qty,
        price: item.product.price_tier_2_price,
      },
      {
        quantity: item.product.price_tier_3_qty,
        price: item.product.price_tier_3_price,
      },
    ],
  })
}

export function getCartItemLineTotal(item: CartItem) {
  return getLineTotal(getCartItemUnitPrice(item), item.quantity)
}

export function validateCartItem(item: CartItem): CartItemValidation {
  if (!item.product.is_available) {
    return {
      status: 'invalid',
      message: "Ce produit n'est plus disponible actuellement.",
    }
  }

  if (item.product.stock_quantity <= 0) {
    return {
      status: 'invalid',
      message: "Le stock n'est plus disponible pour ce produit.",
    }
  }

  if (item.quantity > item.product.stock_quantity) {
    return {
      status: 'invalid',
      message: `La quantite demandee depasse le stock visible (${item.product.stock_quantity}).`,
    }
  }

  if (item.product.stock_quantity <= Math.max(item.product.stock_alert_threshold, 5)) {
    return {
      status: 'warning',
      message: 'Stock limite: validez rapidement avant une nouvelle variation.',
    }
  }

  return {
    status: 'valid',
    message: 'Produit disponible pour le panier.',
  }
}

export function getCartSummary(items: CartItem[]): CartSummary {
  return items.reduce<CartSummary>(
    (summary, item) => {
      const validation = validateCartItem(item)

      summary.lineCount += 1
      summary.totalQuantity += item.quantity
      summary.subtotal += getCartItemLineTotal(item)

      if (validation.status === 'invalid') {
        summary.invalidLineCount += 1
      }

      if (validation.status === 'warning') {
        summary.warningLineCount += 1
      }

      return summary
    },
    {
      lineCount: 0,
      totalQuantity: 0,
      subtotal: 0,
      invalidLineCount: 0,
      warningLineCount: 0,
    }
  )
}

function isProduct(value: unknown): value is Product {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>

  return (
    typeof record.id === 'string' &&
    typeof record.name === 'string' &&
    typeof record.category === 'string' &&
    typeof record.unit === 'string' &&
    typeof record.base_price === 'number' &&
    Array.isArray(record.images) &&
    typeof record.stock_quantity === 'number' &&
    typeof record.stock_alert_threshold === 'number' &&
    typeof record.is_available === 'boolean' &&
    typeof record.is_featured === 'boolean'
  )
}

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>

  return (
    isProduct(record.product) &&
    typeof record.quantity === 'number' &&
    typeof record.added_at === 'string' &&
    typeof record.updated_at === 'string'
  )
}

export function sanitizeCartItems(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as CartItem[]
  }

  return value
    .filter(isCartItem)
    .map((item) => ({
      ...item,
      quantity: clampCartQuantity(item.quantity),
    }))
}
