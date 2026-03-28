import Link from 'next/link'
import { ArrowRight, Egg, ShieldCheck, ShoppingBasket, Truck } from 'lucide-react'
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
import { homepageHighlights } from '@/lib/shop-data'
import { formatCurrency } from '@/lib/utils'

const iconMap = {
  catalog: ShoppingBasket,
  shield: ShieldCheck,
  delivery: Truck,
}

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
                <Link href="/admin/dashboard">Voir le back-office</Link>
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
                featuredProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/85 px-4 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Egg className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.category} • offre {index + 1}
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold">{formatCurrency(product.base_price)}</p>
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
    </main>
  )
}
