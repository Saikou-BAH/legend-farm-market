import type { Metadata } from 'next'
import Link from 'next/link'
import { Leaf, ShieldCheck, Truck } from 'lucide-react'
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

  if (normalized.includes('fiante') || normalized.includes('fiente')) {
    return [
      'Engrais organique naturel issu de l elevage. Efficace pour les cultures maraicheres et les jardins.',
      'Disponible en sac ou en vrac selon les volumes souhaites. Contactez-nous pour les grandes quantites.',
      'Livraison a domicile ou retrait a la ferme selon votre preference.',
    ]
  }

  if (normalized.includes('poulet')) {
    return [
      'Poulets de ponte en fin de cycle. Viande ferme et savoureuse, prix accessibles.',
      'Disponibilite variable selon les lots de ponte. Contactez-nous pour confirmer avant de commander.',
      'Livraison organisee ou retrait a la ferme selon votre besoin.',
    ]
  }

  return [
    'Ramasses regulierement a la ferme. Fraicheur garantie a la date de ponte.',
    'Prix lisibles en GNF avec possibilite d acheter par plateau, demi-plateau ou a l unite.',
    'Livraison a domicile a Conakry ou retrait directement a la ferme.',
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
    return { title: 'Produit introuvable' }
  }

  return {
    title: product.name,
    description:
      product.description ??
      `Commandez ${product.name} directement depuis Legend Farm. Prix en GNF, livraison a Conakry ou retrait a la ferme.`,
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
          title={isConfigured ? 'Produit introuvable' : 'Boutique non configuree'}
          description={
            isConfigured
              ? 'Ce produit n existe pas ou n est plus disponible publiquement.'
              : 'Configurez la connexion Supabase puis ajoutez vos produits depuis l administration.'
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
            Boutique
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
              <Card className="overflow-hidden border-white/80 bg-white/72">
                <ProductVisual
                  name={product.name}
                  imageUrl={primaryImage}
                  className="h-[28rem]"
                  priority
                />
              </Card>

              {galleryImages.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-3">
                  {galleryImages.map((image, index) => (
                    <Card key={`${image}-${index}`} className="overflow-hidden border-white/80 bg-white/72">
                      <ProductVisual
                        name={`${product.name} — photo ${index + 2}`}
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
                  {product.is_featured ? <Badge>Selection Legend Farm</Badge> : null}
                </div>

                <div className="space-y-3">
                  <h1 className="font-serif text-4xl leading-tight md:text-5xl">
                    {product.name}
                  </h1>
                  <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                    {product.description ??
                      'La description detaillee de ce produit sera disponible prochainement.'}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="bg-white/72">
                  <CardContent className="p-5">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Prix
                    </p>
                    <p className="mt-3 font-serif text-3xl">{formatGNF(startingPrice)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">par {product.unit}</p>
                  </CardContent>
                </Card>
                <Card className="bg-white/72">
                  <CardContent className="p-5">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Disponible
                    </p>
                    <p className="mt-3 font-serif text-3xl">{formatNumber(product.stock_quantity)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">en stock actuellement</p>
                  </CardContent>
                </Card>
                <Card className="bg-white/72">
                  <CardContent className="p-5">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Unite
                    </p>
                    <p className="mt-3 font-serif text-3xl">{product.unit}</p>
                    <p className="mt-1 text-sm text-muted-foreground">cadre de vente</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-primary/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.85),rgba(247,251,242,0.95))]">
                <CardHeader>
                  <CardTitle>Tarification</CardTitle>
                  <CardDescription>
                    Prix exprimes en GNF. {priceTiers.length > 0 ? 'Des paliers de quantite sont disponibles.' : 'Prix fixe par unite.'}
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
                      <p className="text-sm font-medium">Prix par quantite</p>
                      <div className="space-y-2">
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
                    <CardTitle className="text-xl">Ce qu il faut savoir</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    {highlights.map((highlight) => (
                      <div
                        key={highlight}
                        className="flex gap-3 rounded-[1.2rem] border border-border/70 bg-white/65 px-4 py-3"
                      >
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
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
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Qualite suivie</p>
                      <p className="mt-1 leading-6 text-muted-foreground">
                        Produit issu de notre elevage, suivi de la ferme a votre commande.
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white/72">
                  <CardContent className="flex gap-3 p-5 text-sm">
                    <Truck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Livraison ou retrait</p>
                      <p className="mt-1 leading-6 text-muted-foreground">
                        A domicile a Conakry ou directement a la ferme selon votre choix.
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white/72">
                  <CardContent className="flex gap-3 p-5 text-sm">
                    <Leaf className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Produit local</p>
                      <p className="mt-1 leading-6 text-muted-foreground">
                        Produit et vendu directement par Legend Farm, sans intermediaire.
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
