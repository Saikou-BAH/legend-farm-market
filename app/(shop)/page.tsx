import Link from 'next/link'
import {
  ArrowRight,
  CircleHelp,
  ShieldCheck,
  ShoppingBasket,
  Truck,
} from 'lucide-react'
import { ProductVisual } from '@/components/shop/product-visual'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { getHomePageData } from '@/lib/actions/shop'
import {
  getProductAvailability,
  getProductPrimaryImage,
  getProductStartingPrice,
} from '@/lib/shop-catalog'
import { homepageHighlights } from '@/lib/shop-data'
import { formatGNF } from '@/lib/utils'

const iconMap = {
  catalog: ShoppingBasket,
  shield: ShieldCheck,
  delivery: Truck,
}

const trustPoints = [
  {
    title: 'Prix lisibles en GNF',
    description:
      'Le site affiche des montants clairs, relies aux donnees configurees par l equipe admin.',
  },
  {
    title: 'Disponibilite visible',
    description:
      'La boutique distingue les produits disponibles, limites ou temporairement indisponibles.',
  },
  {
    title: 'Contact direct',
    description:
      'Le client peut demander une precision ou passer par WhatsApp avant validation si besoin.',
  },
] as const

const shoppingSteps = [
  'Explorer le catalogue et verifier la disponibilite',
  'Ajouter les produits utiles au panier',
  'Choisir livraison ou retrait a la ferme',
  'Suivre ensuite la commande depuis le compte client',
] as const

export default async function ShopHomePage() {
  const { deliveryZoneCount, featuredProducts, isConfigured, productCount, welcomePoints } =
    await getHomePageData()

  return (
    <main>
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(232,244,214,0.95),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(255,227,196,0.7),_transparent_35%)]" />
        <div className="container relative grid gap-12 py-20 md:grid-cols-[1.15fr_0.85fr] md:py-28">
          <div className="space-y-8">
            <Badge className="w-fit">Nouveau canal e-commerce Legend Farm</Badge>
            <div className="space-y-5">
              <h1 className="max-w-3xl font-serif text-5xl leading-tight md:text-7xl">
                Une boutique plus elegante, plus rapide, et vraiment exploitable.
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
                Legend Farm Shop est concue pour vendre en direct, servir les revendeurs
                et fluidifier la livraison locale sans perdre la rigueur operationnelle de la ferme.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/products">
                  Ouvrir la boutique
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/register">Creer un compte client</Link>
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="bg-background/80">
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Catalogue actif</p>
                  <p className="mt-2 font-serif text-3xl">
                    {productCount === null ? 'Supabase' : productCount}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-background/80">
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Zones ouvertes</p>
                  <p className="mt-2 font-serif text-3xl">
                    {deliveryZoneCount === null ? 'A configurer' : deliveryZoneCount}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-background/80">
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Bonus d inscription</p>
                  <p className="mt-2 font-serif text-3xl">
                    {welcomePoints === null ? 'A definir' : `${welcomePoints} pts`}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="border-primary/15 bg-card/90">
            <CardHeader>
              <CardTitle>Panier, promos, livraison, retours</CardTitle>
              <CardDescription>
                Le socle est pense des le depart pour le commerce local, le wholesale et la relation client.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {featuredProducts.length > 0 ? (
                featuredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-background/85 px-4 py-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-14 w-14 overflow-hidden rounded-2xl border border-border/60">
                        <ProductVisual
                          name={product.name}
                          imageUrl={getProductPrimaryImage(product)}
                          className="h-full w-full"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.category} • {getProductAvailability(product).label.toLowerCase()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatGNF(getProductStartingPrice(product))}
                      </p>
                      <Link
                        href={`/products/${product.id}`}
                        className="text-sm text-primary transition-colors hover:text-primary/80"
                      >
                        Voir le detail
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title={
                    isConfigured
                      ? 'Aucun produit mis en avant pour le moment'
                      : 'Connexion Supabase en attente'
                  }
                  description={
                    isConfigured
                      ? 'Publiez vos premiers produits depuis le back-office pour alimenter automatiquement la vitrine.'
                      : 'Ajoutez les variables Supabase puis configurez les produits dans l admin pour remplir cette vitrine.'
                  }
                />
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="container py-16">
        <div className="mb-8 space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Fondations du projet
          </p>
          <h2 className="font-serif text-4xl">
            Le shop repart proprement, pas comme un simple copier-coller.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {homepageHighlights.map((item) => {
            const Icon = iconMap[item.icon]

            return (
              <Card key={item.title} className="h-full">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      </section>

      <section className="container grid gap-6 pb-16 lg:grid-cols-[1fr_1fr]">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Pourquoi cette boutique inspire plus confiance</CardTitle>
            <CardDescription>
              L objectif n est pas seulement de montrer des produits, mais d enlever les
              doutes au moment d acheter.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {trustPoints.map((point) => (
              <div key={point.title} className="rounded-2xl border border-border/70 p-4">
                <p className="font-medium">{point.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{point.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="h-full border-primary/15 bg-card/95">
          <CardHeader>
            <CardTitle>Commander sans se perdre</CardTitle>
            <CardDescription>
              Le parcours a ete simplifie pour rester rassurant aussi bien sur mobile que
              sur desktop.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {shoppingSteps.map((step, index) => (
              <div key={step} className="flex gap-4 rounded-2xl border border-border/70 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                  {index + 1}
                </div>
                <p className="text-sm text-muted-foreground">{step}</p>
              </div>
            ))}

            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild variant="outline">
                <Link href="/delivery">Comprendre la livraison</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/contact">
                  Besoin d aide ?
                  <CircleHelp className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
