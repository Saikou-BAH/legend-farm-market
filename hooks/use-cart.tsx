'use client'

import * as React from 'react'
import {
  CART_STORAGE_KEY,
  clampCartQuantity,
  type CartItem,
  type CartMutationResult,
  getCartSummary,
  isProductPurchasable,
  sanitizeCartItems,
} from '@/lib/cart'
import type { Product } from '@/types'

interface CartContextValue {
  items: CartItem[]
  hydrated: boolean
  addItem: (product: Product, quantity?: number) => CartMutationResult
  updateQuantity: (productId: string, quantity: number) => CartMutationResult
  removeItem: (productId: string) => void
  clearCart: () => void
  summary: ReturnType<typeof getCartSummary>
}

const CartContext = React.createContext<CartContextValue | null>(null)

function readStoredCart() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    return sanitizeCartItems(JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) ?? '[]'))
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartItem[]>([])
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    const nextItems = readStoredCart()
    setItems(nextItems)
    setHydrated(true)
  }, [])

  React.useEffect(() => {
    if (!hydrated || typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  }, [hydrated, items])

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== CART_STORAGE_KEY) {
        return
      }

      setItems(readStoredCart())
    }

    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  const addItem = React.useCallback((product: Product, quantity: number = 1) => {
    if (!isProductPurchasable(product)) {
      return {
        success: false,
        message: "Ce produit n'est pas disponible pour le moment.",
      }
    }

    const nextQuantity = clampCartQuantity(quantity)
    let result: CartMutationResult = {
      success: true,
      message: 'Produit ajoute au panier.',
    }

    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.product.id === product.id)
      const now = new Date().toISOString()

      if (!existingItem) {
        const allowedQuantity = Math.min(nextQuantity, product.stock_quantity)

        if (allowedQuantity < nextQuantity) {
          result = {
            success: true,
            message: `Quantite ajustee a ${allowedQuantity} selon le stock visible.`,
          }
        }

        return [
          {
            product,
            quantity: allowedQuantity,
            added_at: now,
            updated_at: now,
          },
          ...currentItems,
        ]
      }

      const mergedQuantity = existingItem.quantity + nextQuantity
      const allowedQuantity = Math.min(mergedQuantity, product.stock_quantity)

      if (allowedQuantity === existingItem.quantity) {
        result = {
          success: false,
          message: 'La quantite maximale visible pour ce produit est deja atteinte.',
        }

        return currentItems
      }

      if (allowedQuantity < mergedQuantity) {
        result = {
          success: true,
          message: `Quantite ajustee a ${allowedQuantity} selon le stock visible.`,
        }
      }

      return currentItems.map((item) =>
        item.product.id === product.id
          ? {
              ...item,
              product,
              quantity: allowedQuantity,
              updated_at: now,
            }
          : item
      )
    })

    return result
  }, [])

  const updateQuantity = React.useCallback((productId: string, quantity: number) => {
    let result: CartMutationResult = {
      success: true,
      message: 'Quantite mise a jour.',
    }

    setItems((currentItems) => {
      const targetItem = currentItems.find((item) => item.product.id === productId)

      if (!targetItem) {
        result = {
          success: false,
          message: 'Produit introuvable dans le panier.',
        }
        return currentItems
      }

      const normalizedQuantity = clampCartQuantity(quantity)
      const allowedQuantity = Math.min(normalizedQuantity, Math.max(targetItem.product.stock_quantity, 1))

      if (!targetItem.product.is_available || targetItem.product.stock_quantity <= 0) {
        result = {
          success: false,
          message: "Ce produit n'est plus disponible.",
        }
        return currentItems
      }

      if (allowedQuantity < normalizedQuantity) {
        result = {
          success: true,
          message: `Quantite ajustee a ${allowedQuantity} selon le stock visible.`,
        }
      }

      return currentItems.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity: allowedQuantity,
              updated_at: new Date().toISOString(),
            }
          : item
      )
    })

    return result
  }, [])

  const removeItem = React.useCallback((productId: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.product.id !== productId))
  }, [])

  const clearCart = React.useCallback(() => {
    setItems([])
  }, [])

  const value = React.useMemo<CartContextValue>(
    () => ({
      items,
      hydrated,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      summary: getCartSummary(items),
    }),
    [addItem, clearCart, hydrated, items, removeItem, updateQuantity]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = React.useContext(CartContext)

  if (!context) {
    throw new Error('useCart doit etre utilise dans CartProvider.')
  }

  return context
}
