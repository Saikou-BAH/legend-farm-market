import Link from 'next/link'
import { AddToCartButton } from '@/components/shop/add-to-cart-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ProductVisual } from '@/components/shop/product-visual'
import {
  getProductAvailability,
  getProductPrimaryImage,
  getProductPriceTiers,
  getProductStartingPrice,
} from '@/lib/shop-catalog'
import { formatGNF } from '@/lib/utils'
import type { Product } from '@/types'

interface ProductCardProps {
  product: Product
  href: string
  context?: 'shop' | 'admin'
}

export function ProductCard({
  product,
  href,
  context = 'shop',
}: ProductCardProps) {
  const availability = getProductAvailability(product)
  const primaryImage = getProductPrimaryImage(product)
  const tierCount = getProductPriceTiers(product).length
  const startingPrice = getProductStartingPrice(product)
  const hasTieredPricing = tierCount > 0
  const description =
    product.description ?? 'La description de ce produit sera disponible prochainement.'

  return (
    <Card className="group surface-panel h-full overflow-hidden border-white/80 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_70px_rgba(20,60,42,0.16)]">
      <Link href={href} className="block">
        <div className="relative overflow-hidden">
          <ProductVisual
            name={product.name}
            imageUrl={primaryImage}
            className="h-64"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[rgba(12,35,24,0.42)] to-transparent" />
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <Badge variant="secondary" className="w-fit bg-white/88 text-foreground">
              {product.category}
            </Badge>
            <Badge variant={availability.variant} className="w-fit">
              {availability.label}
            </Badge>
          </div>
          {product.is_featured ? (
            <div className="absolute bottom-4 left-4 rounded-full border border-white/30 bg-[rgba(13,44,30,0.7)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur">
              Selection Legend Farm
            </div>
          ) : null}
        </div>
      </Link>
      <CardContent className="space-y-5 p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Link href={href} className="block">
              <h3 className="font-serif text-[1.9rem] font-semibold leading-tight transition-colors group-hover:text-primary">
                {product.name}
              </h3>
            </Link>
            <p className="min-h-[3.75rem] text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>

          <div className="grid gap-3 rounded-[1.35rem] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.74),rgba(248,249,243,0.84))] p-4 sm:grid-cols-2">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Tarification
              </p>
              <p className="mt-2 text-2xl font-semibold">{formatGNF(startingPrice)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {hasTieredPricing ? 'tarif de depart' : 'prix actuel'} par {product.unit}
              </p>
            </div>
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Lecture rapide
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {context === 'admin'
                  ? `${product.stock_quantity} en stock`
                  : product.stock_quantity > 0 && product.stock_quantity <= 10
                    ? `Plus que ${product.stock_quantity} disponible${product.stock_quantity > 1 ? 's' : ''}`
                    : hasTieredPricing
                      ? `${tierCount} paliers de quantite`
                      : `Vendu par ${product.unit}`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {context === 'admin'
                  ? 'Visible dans le catalogue'
                  : product.stock_quantity > 0 && product.stock_quantity <= 10
                    ? 'Stock limite, commandez vite'
                    : 'Disponibilite confirmee au panier'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {context === 'admin' ? (
            <Button asChild size="sm" variant="outline">
              <Link href={href}>Gerer</Link>
            </Button>
          ) : (
            <div className="flex w-full flex-col gap-2 sm:flex-row">
              <AddToCartButton product={product} className="flex-1" />
              <Button asChild size="sm" variant="outline" className="flex-1">
                <Link href={href}>Voir le detail</Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
