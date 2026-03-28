'use client'

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/hooks/use-cart'

export function CartStatusButton() {
  const { hydrated, summary } = useCart()

  return (
    <Button asChild size="sm" className="relative">
      <Link href="/cart" aria-label="Ouvrir le panier">
        <ShoppingCart className="h-4 w-4" />
        Panier
        {hydrated && summary.totalQuantity > 0 ? (
          <span className="absolute -right-2 -top-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-accent-foreground">
            {summary.totalQuantity}
          </span>
        ) : null}
      </Link>
    </Button>
  )
}
