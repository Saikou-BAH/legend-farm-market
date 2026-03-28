'use client'

import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { useCart } from '@/hooks/use-cart'
import { isProductPurchasable } from '@/lib/cart'
import type { Product } from '@/types'

interface AddToCartButtonProps {
  product: Product
  quantity?: number
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export function AddToCartButton({
  product,
  quantity = 1,
  size = 'sm',
  className,
}: AddToCartButtonProps) {
  const { addItem } = useCart()
  const canAdd = isProductPurchasable(product)

  return (
    <Button
      type="button"
      size={size}
      className={className}
      disabled={!canAdd}
      onClick={() => {
        const result = addItem(product, quantity)

        toast({
          title: result.success ? 'Panier mis a jour' : 'Ajout impossible',
          description: result.message,
          variant: result.success ? 'default' : 'destructive',
        })
      }}
    >
      <ShoppingCart className="h-4 w-4" />
      {canAdd ? 'Ajouter' : 'Indisponible'}
    </Button>
  )
}
