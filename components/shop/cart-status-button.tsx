'use client'

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/hooks/use-cart'

export function CartStatusButton() {
  const { hydrated, summary } = useCart()

  return (
    <Button asChild size="sm" className="relative min-w-[8.8rem]">
      <Link href="/cart" aria-label="Ouvrir le panier">
        <ShoppingCart className="h-4 w-4" />
        Panier
        {hydrated && summary.totalQuantity > 0 ? (
          <span className="absolute -right-2 -top-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-white/80 bg-accent px-1.5 text-xs font-semibold text-accent-foreground shadow-[0_12px_24px_rgba(18,61,39,0.15)]">
            {summary.totalQuantity}
          </span>
        ) : null}
      </Link>
    </Button>
  )
}
