import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { AddToCartButton } from '@/components/shop/add-to-cart-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ProductVisual } from '@/components/shop/product-visual'
import {
  getProductPriceTiers,
  getProductPrimaryImage,
  getProductStartingPrice,
  resolveAvailabilityStatus,
} from '@/lib/shop-catalog'
import { formatGNF } from '@/lib/utils'
import type { Product } from '@/types'

interface ProductCardProps {
  product: Product
  href: string
  context?: 'shop' | 'admin'
}

/** Status-coded label colors — NOT the gray disabled style */
const unavailableButtonClass: Record<string, string> = {
  out_of_stock:
    'w-full cursor-not-allowed border border-amber-300/60 bg-amber-50 text-amber-700 opacity-100',
  unavailable:
    'w-full cursor-not-allowed border border-border/60 bg-muted/60 text-muted-foreground opacity-100',
  coming_soon:
    'w-full cursor-not-allowed border border-primary/30 bg-primary/5 text-primary opacity-100',
}

export function ProductCard({
  product,
  href,
  context = 'shop',
}: ProductCardProps) {
  const avail = resolveAvailabilityStatus(product)
  const primaryImage = getProductPrimaryImage(product)
  const tierCount = getProductPriceTiers(product).length
  const startingPrice = getProductStartingPrice(product)
  const description =
    product.description ?? 'La description de ce produit sera disponible prochainement.'

  const isShop = context === 'shop'
  const purchasable = avail.purchasable

  return (
    <Card
      className={[
        'group surface-panel h-full overflow-hidden border-white/80 transition-all duration-300',
        purchasable ? 'hover:-translate-y-1.5 hover:shadow-[0_28px_70px_rgba(20,60,42,0.16)]' : '',
      ].join(' ')}
    >
      {/* ── Image with optional status overlay ── */}
      <Link href={href} className="block">
        <div className="relative overflow-hidden">
          <ProductVisual
            name={product.name}
            imageUrl={primaryImage}
            className="h-64"
            disableHoverScale={!purchasable}
          />

          {/* Dim overlay when not purchasable */}
          {isShop && !purchasable && avail.overlayClasses ? (
            <div
              className={[
                'pointer-events-none absolute inset-0 transition-opacity',
                avail.overlayClasses,
              ].join(' ')}
            />
          ) : null}

          {/* Availability badge on image */}
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-white/88 text-foreground">
              {product.category}
            </Badge>
            {isShop ? (
              <Badge
                variant={avail.variant}
                className={
                  !purchasable
                    ? 'border-0 bg-white/90 font-semibold text-foreground shadow-sm backdrop-blur-sm'
                    : 'bg-white/88 text-foreground'
                }
              >
                {avail.label}
              </Badge>
            ) : (
              <Badge variant={avail.variant}>{avail.label}</Badge>
            )}
          </div>

          {/* "Sélection Legend Farm" badge when featured + available */}
          {product.is_featured && purchasable ? (
            <div className="absolute bottom-4 left-4 rounded-full border border-white/30 bg-[rgba(13,44,30,0.7)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur">
              Selection Legend Farm
            </div>
          ) : null}

          {/* Centred status pill on image when not available (shop only) */}
          {isShop && !purchasable ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="rounded-full border border-white/25 bg-white/90 px-4 py-1.5 text-sm font-semibold text-foreground shadow-lg backdrop-blur-sm">
                {avail.label}
              </span>
            </div>
          ) : null}
        </div>
      </Link>

      {/* ── Card body ── */}
      <CardContent className="space-y-5 p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Link href={href} className="block">
              <h3 className="font-serif text-[1.9rem] font-semibold leading-tight transition-colors group-hover:text-primary">
                {product.name}
              </h3>
            </Link>
            <p className="min-h-[3.75rem] text-sm leading-6 text-muted-foreground line-clamp-3">
              {description}
            </p>
          </div>

          <div className="grid gap-3 rounded-[1.35rem] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.74),rgba(248,249,243,0.84))] p-4 sm:grid-cols-2">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Prix
              </p>
              <p className="mt-2 text-2xl font-semibold">{formatGNF(startingPrice)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {tierCount > 0 ? 'tarif de depart' : 'prix fixe'} · par {product.unit}
              </p>
            </div>
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {context === 'admin' ? 'Stock' : 'Disponibilite'}
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {context === 'admin'
                  ? `${product.stock_quantity} en stock`
                  : !purchasable && product.restock_note
                    ? product.restock_note
                    : product.stock_quantity > 0 && product.stock_quantity <= 10
                      ? `Plus que ${product.stock_quantity} disponible${product.stock_quantity > 1 ? 's' : ''}`
                      : tierCount > 0
                        ? `${tierCount} paliers de quantite`
                        : `Vendu par ${product.unit}`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {context === 'admin'
                  ? 'Visible dans le catalogue'
                  : !purchasable
                    ? 'Non disponible a la commande'
                    : product.stock_quantity > 0 && product.stock_quantity <= 10
                      ? 'Stock limite, commandez vite'
                      : 'Disponibilite confirmee au panier'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {context === 'admin' ? (
            <Button asChild size="sm" variant="outline">
              <Link href={href}>Gerer</Link>
            </Button>
          ) : purchasable ? (
            <>
              <AddToCartButton product={product} className="flex-1" />
              <Button asChild size="sm" variant="outline" className="flex-1">
                <Link href={href}>Voir le detail</Link>
              </Button>
            </>
          ) : (
            <>
              <button
                disabled
                aria-disabled="true"
                className={[
                  'inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-full px-4 text-[0.82rem] font-medium transition-none',
                  unavailableButtonClass[avail.status] ?? unavailableButtonClass.unavailable,
                ].join(' ')}
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                {avail.buttonLabel}
              </button>
              <Button asChild size="sm" variant="outline" className="flex-1">
                <Link href={href}>Voir le detail</Link>
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
