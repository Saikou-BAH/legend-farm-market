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
    product.description ?? 'Description a completer depuis le back-office.'

  return (
    <Card className="group h-full overflow-hidden border-border/60 transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl">
      <Link href={href} className="block">
        <ProductVisual
          name={product.name}
          imageUrl={primaryImage}
          className="h-56"
        />
      </Link>
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="w-fit">
            {product.category}
          </Badge>
          <Badge variant={availability.variant} className="w-fit">
            {availability.label}
          </Badge>
          {product.is_featured ? (
            <Badge className="w-fit">Mis en avant</Badge>
          ) : null}
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Link href={href} className="block">
              <h3 className="font-serif text-2xl font-semibold transition-colors group-hover:text-primary">
                {product.name}
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {context === 'admin'
              ? `${product.stock_quantity} en stock visible`
              : hasTieredPricing
                ? `${tierCount} paliers de prix disponibles`
                : `Vente a l unite par ${product.unit}`}
          </p>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {hasTieredPricing ? 'Tarif a partir de' : 'Prix actuel'}
            </p>
            <p className="text-xl font-semibold">{formatGNF(startingPrice)}</p>
            <p className="text-xs text-muted-foreground">par {product.unit}</p>
          </div>
          {context === 'admin' ? (
            <Button asChild size="sm" variant="outline">
              <Link href={href}>Gerer</Link>
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <AddToCartButton product={product} />
              <Button asChild size="sm" variant="outline">
                <Link href={href}>Voir le detail</Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
