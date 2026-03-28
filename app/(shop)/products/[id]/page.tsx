import type { Metadata } from 'next'
import Link from 'next/link'
import { Leaf, ShieldCheck, Sparkles, Truck } from 'lucide-react'
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

function getProductHighlights(name: string, category: string) {
  const normalized = `${name} ${category}`.toLowerCase()

  if (normalized.includes('fiante')) {
    return [
      'Presentation propre et professionnelle pour un usage agricole rentable.',
      'Lecture claire des quantites et des conditions de commande.',
      'Produit montre comme un intrant utile, pas comme un produit secondaire.',
    ]
  }

  if (normalized.includes('poulet')) {
    return [
      'Produit utile et accessible avec une presentation plus serieuse.',
      'Disponibilite et quantites relues avant validation finale.',
      'Commande suivie pour limiter les ambiguities logistiques.',
    ]
  }

  return [
    'Presentation plus rassurante pour un achat quotidien et repetable.',
    'Tarifs lisibles en GNF avec paliers de prix visibles.',
    'Disponibilite et logistique expliquees plus clairement.',
  ]
}

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
  const highlights = getProductHighlights(product.name, product.category)

  return (
    <main className="pb-20">
      <section className="container pt-8 md:pt-12">
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
      </section>

      <section className="container pt-6">
        <div className="surface-panel relative overflow-hidden rounded-[2.4rem] px-6 py-8 md:px-8 md:py-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(184,226,127,0.15),transparent_28%),radial-gradient(circle_at_86%_12%,rgba(146,196,255,0.12),transparent_24%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-4">
              <Card className="group overflow-hidden border-white/80 bg-white/72">
                <ProductVisual
                  name={product.name}
                  imageUrl={primaryImage}
                  className="h-[30rem]"
                  priority
                />
              </Card>

              {galleryImages.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-3">
                  {galleryImages.map((image, index) => (
                    <Card key={`${image}-${index}`} className="overflow-hidden border-white/80 bg-white/72">
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
              <div className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{product.category}</Badge>
                  <Badge variant={availability.variant}>{availability.label}</Badge>
                  {product.is_featured ? <Badge>Mis en avant</Badge> : null}
                </div>

                <div className="space-y-3">
                  <h1 className="font-serif text-4xl leading-tight md:text-6xl">
                    {product.name}
                  </h1>
                  <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                    {product.description ??
                      'La description detaillee sera enrichie depuis le back-office pour rassurer l acheteur.'}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="bg-white/72">
                  <CardContent className="p-5">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Tarif de depart
                    </p>
                    <p className="mt-3 font-serif text-3xl">{formatGNF(startingPrice)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">par {product.unit}</p>
                  </CardContent>
                </Card>
                <Card className="bg-white/72">
                  <CardContent className="p-5">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Stock visible
                    </p>
                    <p className="mt-3 font-serif text-3xl">{formatNumber(product.stock_quantity)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">quantite actuellement visible</p>
                  </CardContent>
                </Card>
                <Card className="bg-white/72">
                  <CardContent className="p-5">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Unite
                    </p>
                    <p className="mt-3 font-serif text-3xl">{product.unit}</p>
                    <p className="mt-1 text-sm text-muted-foreground">cadre de vente configure</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-primary/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.85),rgba(247,251,242,0.95))]">
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
                            className="flex items-center justify-between rounded-2xl border border-border/70 bg-white/72 px-4 py-3 text-sm"
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
                <Card className="bg-white/72">
                  <CardHeader>
                    <CardTitle className="text-2xl">Pourquoi ce produit inspire confiance</CardTitle>
                    <CardDescription>
                      Une lecture plus claire pour transformer plus facilement l intention d achat.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    {highlights.map((highlight) => (
                      <div
                        key={highlight}
                        className="flex gap-3 rounded-[1.2rem] border border-border/70 bg-white/65 px-4 py-3"
                      >
                        <div className="mt-0.5 text-primary">
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        <p className="leading-6">{highlight}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <ProductPurchaseCard
                  product={product}
                  shopEmail={shopProfile.shopEmail}
                  shopPhone={shopProfile.shopPhone}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-white/72">
                  <CardContent className="flex gap-3 p-5 text-sm">
                    <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Presentation premium</p>
                      <p className="mt-1 leading-6 text-muted-foreground">
                        Des visuels et une hierarchie plus propres pour donner envie d acheter.
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white/72">
                  <CardContent className="flex gap-3 p-5 text-sm">
                    <Truck className="mt-0.5 h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Logistique plus lisible</p>
                      <p className="mt-1 leading-6 text-muted-foreground">
                        Livraison ou retrait ferme avec informations plus visibles.
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white/72">
                  <CardContent className="flex gap-3 p-5 text-sm">
                    <Leaf className="mt-0.5 h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Image agricole propre</p>
                      <p className="mt-1 leading-6 text-muted-foreground">
                        Une presentation qui valorise autant les produits alimentaires que les usages agricoles.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container pt-10">
        <ProductReviewsSection
          averageRating={reviewsState.averageRating}
          reviews={reviewsState.reviews}
        />
      </section>
    </main>
  )
}
