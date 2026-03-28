import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  Bird,
  Egg,
  Leaf,
  ShieldCheck,
  Sparkles,
  Truck,
  WalletCards,
} from 'lucide-react'
import { ProductCard } from '@/components/shop/product-card'
import { ProductVisual } from '@/components/shop/product-visual'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { getHomePageData, getPublicShopProfile } from '@/lib/actions/shop'
import {
  getProductAvailability,
  getProductPrimaryImage,
  getProductStartingPrice,
} from '@/lib/shop-catalog'
import { formatGNF, formatNumber } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Accueil',
  description:
    'Legend Farm Shop presente une experience premium pour commander des oeufs, poulets reformes et solutions agricoles avec un parcours clair et moderne.',
}

const featuredFamilies = [
  {
    title: 'Oeufs',
    description:
      'Fraicheur, confiance quotidienne et presentation propre pour un achat simple et rassurant.',
    icon: Egg,
  },
  {
    title: 'Poulets reformes',
    description:
      'Un produit utile et accessible, presente avec la meme rigueur que les references premium.',
    icon: Bird,
  },
  {
    title: 'Fiante',
    description:
      'Une solution agricole rentable et professionnelle, montree comme un intrant propre et utile.',
    icon: Leaf,
  },
]

const sellingPoints = [
  {
    title: 'Qualite visible',
    description:
      'Une vitrine plus nette, plus lisible et plus rassurante pour mettre les produits en confiance.',
    icon: ShieldCheck,
  },
  {
    title: 'Commande simple',
    description:
      'Catalogue clair, panier persistant et etapes d achat plus fluides de la selection au suivi.',
    icon: WalletCards,
  },
  {
    title: 'Logistique claire',
    description:
      'Livraison locale, retrait ferme et informations utiles visibles sans surcharge.',
    icon: Truck,
  },
]

export default async function HomePage() {
  const [homeData, shopProfile] = await Promise.all([
    getHomePageData(),
    getPublicShopProfile(),
  ])

  const heroProducts = homeData.featuredProducts.slice(0, 3)

  return (
    <main className="pb-24">
      <section className="container pt-8 md:pt-12">
        <div className="surface-panel section-grid relative overflow-hidden rounded-[2.5rem] px-6 py-8 md:px-10 md:py-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(184,226,127,0.2),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(125,173,255,0.16),transparent_24%)]" />
          <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="space-y-8">
              <div className="space-y-5">
                <Badge variant="secondary">Ferme moderne du futur</Badge>
                <div className="space-y-4">
                  <h1 className="max-w-4xl font-serif text-5xl leading-[1.02] md:text-6xl xl:text-7xl">
                    Des produits fermiers presentes comme une{' '}
                    <span className="text-gradient-brand">marque premium</span>.
                  </h1>
                  <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                    Legend Farm Shop transforme la vente d oeufs, de poulets reformes
                    et de fiante en une experience plus propre, plus claire, plus
                    moderne et plus rassurante.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/products">
                    Explorer la boutique
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/contact">Parler a la ferme</Link>
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="bg-white/72">
                  <CardContent className="p-5">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Catalogue public
                    </p>
                    <p className="mt-3 font-serif text-3xl">
                      {homeData.productCount ? formatNumber(homeData.productCount) : '0'}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      produits visibles en ligne
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-white/72">
                  <CardContent className="p-5">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Livraison
                    </p>
                    <p className="mt-3 font-serif text-3xl">
                      {homeData.deliveryZoneCount
                        ? formatNumber(homeData.deliveryZoneCount)
                        : '0'}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      zones actuellement configurees
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-white/72">
                  <CardContent className="p-5">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Fidelisation
                    </p>
                    <p className="mt-3 font-serif text-3xl">
                      {homeData.welcomePoints ? formatNumber(homeData.welcomePoints) : '0'}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      points de bienvenue a l inscription
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="surface-panel-strong relative overflow-hidden rounded-[2rem] px-6 py-6 text-white">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_32%)]" />
                <div className="relative space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full border border-white/15 bg-white/10 p-3">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
                        Signature visuelle
                      </p>
                      <p className="text-lg font-medium">
                        Nature maitrisee, logistique claire, image premium
                      </p>
                    </div>
                  </div>
                  <p className="max-w-xl text-sm leading-7 text-white/76">
                    Un site concu pour inspirer confiance immediatement: prix lisibles,
                    parcours de commande propre, contact visible et produits presentes
                    avec plus de desirabilite.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {heroProducts.length > 0
                  ? heroProducts.map((product) => {
                      const availability = getProductAvailability(product)

                      return (
                        <Card
                          key={product.id}
                          className="group overflow-hidden bg-white/76 transition-transform duration-300 hover:-translate-y-1"
                        >
                          <ProductVisual
                            name={product.name}
                            imageUrl={getProductPrimaryImage(product)}
                            className="h-36"
                          />
                          <CardContent className="space-y-3 p-4">
                            <div className="space-y-2">
                              <Badge variant={availability.variant}>{availability.label}</Badge>
                              <h2 className="font-serif text-2xl leading-tight">
                                {product.name}
                              </h2>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                a partir de
                              </p>
                              <p className="mt-1 text-lg font-semibold">
                                {formatGNF(getProductStartingPrice(product))}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })
                  : featuredFamilies.map((family) => (
                      <Card key={family.title} className="bg-white/76">
                        <CardContent className="space-y-4 p-5">
                          <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-primary/10 text-primary">
                            <family.icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h2 className="font-serif text-2xl">{family.title}</h2>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                              {family.description}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container pt-10">
        <div className="grid gap-4 lg:grid-cols-3">
          {sellingPoints.map((item) => (
            <Card key={item.title} className="bg-white/72">
              <CardContent className="flex gap-4 p-6">
                <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-serif text-2xl">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container pt-16">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <Badge variant="secondary">Produits phares</Badge>
            <div className="space-y-3">
              <h2 className="font-serif text-4xl md:text-5xl">
                Une selection nette, premium et vendeuse
              </h2>
              <p className="max-w-3xl text-base leading-7 text-muted-foreground">
                Chaque produit gagne en lisibilite, en desirabilite et en
                reassurance pour transformer plus facilement l intention d achat.
              </p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href="/products">
              Voir tout le catalogue
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-8">
          {homeData.featuredProducts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {homeData.featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} href={`/products/${product.id}`} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={
                homeData.isConfigured
                  ? 'Ajoutez vos produits phares'
                  : 'Supabase n est pas encore configure'
              }
              description={
                homeData.isConfigured
                  ? 'La home mettra automatiquement en avant vos produits des que le catalogue sera publie.'
                  : 'Renseignez la connexion Supabase puis publiez vos premiers produits.'
              }
            />
          )}
        </div>
      </section>

      <section className="container pt-16">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="surface-panel-strong rounded-[2rem] text-white">
            <CardContent className="space-y-5 p-8">
              <Badge className="w-fit bg-white/12 text-white">Pourquoi ca rassure</Badge>
              <h2 className="max-w-md font-serif text-4xl leading-tight">
                Une ferme qui parait plus organisee, plus moderne et plus credible.
              </h2>
              <p className="max-w-lg text-sm leading-7 text-white/76">
                La boutique montre la disponibilite, les moyens de contact, les
                conditions de livraison et les prix en GNF sans laisser le client dans
                le doute. Le resultat est plus premium, mais aussi plus vendeur.
              </p>
              <div className="grid gap-3 text-sm text-white/78">
                <div className="rounded-[1.2rem] border border-white/12 bg-white/6 px-4 py-3">
                  Contact visible, WhatsApp accessible, parcours lisible.
                </div>
                <div className="rounded-[1.2rem] border border-white/12 bg-white/6 px-4 py-3">
                  Commande suivie, panier persistant et confirmation plus claire.
                </div>
                <div className="rounded-[1.2rem] border border-white/12 bg-white/6 px-4 py-3">
                  Presentation propre des oeufs, poulets reformes et solutions agricoles.
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            {featuredFamilies.map((family) => (
              <Card key={family.title} className="bg-white/74">
                <CardContent className="space-y-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-primary/10 text-primary">
                    <family.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-3xl">{family.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {family.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container pt-16">
        <Card className="surface-panel overflow-hidden rounded-[2rem]">
          <CardContent className="grid gap-8 p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="space-y-4">
              <Badge variant="secondary">Prochain pas</Badge>
              <h2 className="font-serif text-4xl md:text-5xl">
                Commander plus vite, avec plus de confiance.
              </h2>
              <p className="max-w-3xl text-base leading-7 text-muted-foreground">
                {shopProfile.shopName} met maintenant en avant une presentation plus
                haut de gamme, mais garde un langage simple, utile et credible pour
                convertir sans surjouer.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/products">
                  Commencer mes achats
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/contact">Contacter {shopProfile.shopName}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
