import type { Metadata } from 'next'
import Link from 'next/link'
import { EmptyState } from '@/components/ui/empty-state'
import { ProductPurchaseCard } from '@/components/shop/product-purchase-card'
import { ProductReviewsSection } from '@/components/shop/product-reviews-section'
import { ProductVisual } from '@/components/shop/product-visual'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getProductById } from '@/lib/actions/products'
import { getPublicShopProfile } from '@/lib/actions/shop'
import { getPublicProductReviews } from '@/lib/actions/reviews'
import {
  getProductAvailability,
  getProductPriceTiers,
  getProductPrimaryImage,
  getProductStartingPrice,
} from '@/lib/shop-catalog'
import { formatGNF, formatNumber } from '@/lib/utils'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const { product } = await getProductById(id)

  if (!product) {
    return {
      title: 'Produit introuvable',
    }
  }

  return {
    title: product.name,
    description:
      product.description ??
      `Consultez le produit ${product.name}, sa disponibilite actuelle et ses tarifs en GNF.`,
  }
}

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [{ isConfigured, product }, shopProfile] = await Promise.all([
    getProductById(id),
    getPublicShopProfile(),
  ])

  if (!product) {
    return (
      <main className="container py-12">
        <EmptyState
          title={isConfigured ? 'Produit introuvable' : 'Supabase n est pas encore configure'}
          description={
            isConfigured
              ? 'Ce produit n existe pas encore ou n est pas disponible publiquement.'
              : 'Connectez Supabase puis ajoutez vos produits dans l admin.'
          }
        />
      </main>
    )
  }

  const primaryImage = getProductPrimaryImage(product)
  const galleryImages = product.images.filter((image) => image && image !== primaryImage)
  const priceTiers = getProductPriceTiers(product)
  const availability = getProductAvailability(product)
  const startingPrice = getProductStartingPrice(product)
  const reviewsState = await getPublicProductReviews(product.id)

  return (
    <main className="container space-y-10 py-12">
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-foreground">
          Accueil
        </Link>
        <span>/</span>
        <Link href="/products" className="transition-colors hover:text-foreground">
          Catalogue
        </Link>
        <span>/</span>
        <span className="text-foreground">{product.name}</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <Card className="overflow-hidden border-border/60">
            <ProductVisual
              name={product.name}
              imageUrl={primaryImage}
              className="h-[26rem]"
              priority
            />
          </Card>

          {galleryImages.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {galleryImages.map((image, index) => (
                <Card key={`${image}-${index}`} className="overflow-hidden border-border/60">
                  <ProductVisual
                    name={`${product.name} - visuel ${index + 2}`}
                    imageUrl={image}
                    className="h-40"
                  />
                </Card>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{product.category}</Badge>
              <Badge variant={availability.variant}>{availability.label}</Badge>
              {product.is_featured ? <Badge>Mis en avant</Badge> : null}
            </div>

            <div className="space-y-3">
              <h1 className="font-serif text-4xl md:text-5xl">{product.name}</h1>
              <p className="text-lg text-muted-foreground">
                {product.description ??
                  'La description detaillee sera enrichie depuis le back-office pour rassurer l acheteur.'}
              </p>
            </div>
          </div>

          <Card className="border-primary/15 bg-card/95">
            <CardHeader>
              <CardTitle>Tarification</CardTitle>
              <CardDescription>
                Les montants affiches viennent des donnees configurees dans Supabase et sont exprimes en GNF.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-end justify-between gap-6 border-b border-border/70 pb-5">
                <div>
                  <p className="text-sm text-muted-foreground">Prix de reference</p>
                  <p className="mt-2 font-serif text-4xl">{formatGNF(startingPrice)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">par {product.unit}</p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>Prix de base</p>
                  <p className="font-medium text-foreground">{formatGNF(product.base_price)}</p>
                </div>
              </div>

              {priceTiers.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Paliers de prix</p>
                  <div className="space-y-3">
                    {priceTiers.map((tier) => (
                      <div
                        key={`${tier.quantity}-${tier.price}`}
                        className="flex items-center justify-between rounded-2xl border border-border/70 px-4 py-3 text-sm"
                      >
                        <span className="text-muted-foreground">
                          A partir de {formatNumber(tier.quantity)} {product.unit}
                        </span>
                        <span className="font-semibold">{formatGNF(tier.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Disponibilite</CardTitle>
                <CardDescription>{availability.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Stock visible</span>
                  <span>{formatNumber(product.stock_quantity)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Seuil d alerte</span>
                  <span>{formatNumber(product.stock_alert_threshold)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Unite vendue</span>
                  <span>{product.unit}</span>
                </div>
              </CardContent>
            </Card>

            <ProductPurchaseCard
              product={product}
              shopEmail={shopProfile.shopEmail}
              shopPhone={shopProfile.shopPhone}
            />
          </div>
        </div>
      </div>

      <ProductReviewsSection
        averageRating={reviewsState.averageRating}
        reviews={reviewsState.reviews}
      />
    </main>
  )
}
