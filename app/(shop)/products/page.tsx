import type { Metadata } from 'next'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { ProductCard } from '@/components/shop/product-card'
import { WhatsAppButton } from '@/components/shop/whatsapp-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { getProductsCatalog } from '@/lib/actions/products'
import { getPublicShopProfile } from '@/lib/actions/shop'

export const metadata: Metadata = {
  title: 'Boutique',
  description:
    'Casiers d oeufs, poulets reformes et sacs de fiente. Disponibilite et tarifs a jour, livraison ou retrait a la ferme.',
}

function getSearchParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]
  }
  return value
}

function buildCatalogHref(search: string | null, category: string | null) {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (category) params.set('category', category)
  const query = params.toString()
  return query ? `/products?${query}` : '/products'
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string | string[]
    category?: string | string[]
  }>
}) {
  const params = await searchParams
  const requestedSearch = getSearchParamValue(params.search)?.trim() ?? null
  const requestedCategory = getSearchParamValue(params.category)?.trim() ?? null
  const { activeFilters, categories, isConfigured, products, resultCount, totalCount } =
    await getProductsCatalog({
      search: requestedSearch,
      category: requestedCategory,
    })
  const hasActiveFilters = Boolean(activeFilters.search || activeFilters.category)
  const shopProfile = await getPublicShopProfile()

  return (
    <main className="pb-20">
      <section className="container pt-8 md:pt-12">
        <div className="surface-panel section-grid relative overflow-hidden rounded-[2.4rem] px-6 py-8 md:px-10 md:py-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(184,226,127,0.18),transparent_30%),radial-gradient(circle_at_85%_15%,rgba(138,194,255,0.14),transparent_24%)]" />
          <div className="relative space-y-4">
            <Badge variant="secondary">Boutique</Badge>
            <h1 className="max-w-2xl font-serif text-5xl leading-tight md:text-6xl">
              Nos produits fermiers
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              Casiers d oeufs de 30, poulets reformes et sacs de fiente.
              Disponibilite a jour, prix confirmes a la commande.
            </p>
          </div>
        </div>
      </section>

      <section className="container pt-6">
        <Card className="surface-panel border-white/80">
          <CardContent className="space-y-5 p-5 md:p-6">
            <form action="/products" className="flex flex-wrap items-end gap-3">
              <div className="flex-1 space-y-2" style={{ minWidth: '200px' }}>
                <label htmlFor="catalog-search" className="text-sm font-medium">
                  Rechercher
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="catalog-search"
                    name="search"
                    placeholder="Oeufs, poulet, fiente..."
                    defaultValue={activeFilters.search ?? ''}
                    className="pl-11"
                  />
                </div>
              </div>
              {activeFilters.category ? (
                <input type="hidden" name="category" value={activeFilters.category} />
              ) : null}
              <Button type="submit">Rechercher</Button>
              {hasActiveFilters ? (
                <Button asChild variant="outline">
                  <Link href="/products">Effacer les filtres</Link>
                </Button>
              ) : null}
            </form>

            {categories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  asChild
                  size="sm"
                  variant={!activeFilters.category ? 'default' : 'outline'}
                >
                  <Link href={buildCatalogHref(activeFilters.search, null)}>
                    Tous
                  </Link>
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category}
                    asChild
                    size="sm"
                    variant={activeFilters.category === category ? 'default' : 'outline'}
                  >
                    <Link href={buildCatalogHref(activeFilters.search, category)}>
                      {category}
                    </Link>
                  </Button>
                ))}
              </div>
            ) : null}

            {totalCount > 0 ? (
              <p className="text-xs text-muted-foreground">
                {hasActiveFilters
                  ? `${resultCount} resultat${resultCount > 1 ? 's' : ''} sur ${totalCount} produits`
                  : `${totalCount} produit${totalCount > 1 ? 's' : ''} disponible${totalCount > 1 ? 's' : ''}`}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="container pt-6">
        {products.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                href={`/products/${product.id}`}
              />
            ))}
          </div>
        ) : (
          <div className="surface-panel rounded-[2rem] px-8 py-12 text-center">
            {isConfigured ? (
              hasActiveFilters ? (
                <div className="mx-auto max-w-sm space-y-4">
                  <p className="font-serif text-2xl">Aucun resultat</p>
                  <p className="text-sm leading-7 text-muted-foreground">
                    Aucun produit ne correspond a cette recherche. Essayez un
                    autre mot-cle ou retirez les filtres actifs.
                  </p>
                  <Button asChild variant="outline">
                    <Link href="/products">Voir tous les produits</Link>
                  </Button>
                </div>
              ) : (
                <div className="mx-auto max-w-md space-y-5">
                  <p className="font-serif text-3xl">Catalogue en preparation</p>
                  <p className="text-sm leading-7 text-muted-foreground">
                    Les produits seront disponibles ici tres prochainement. En
                    attendant, vous pouvez commander directement par WhatsApp —
                    oeufs, poulets reformes ou fiente.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <WhatsAppButton
                      phone={shopProfile.shopPhone}
                      label="Commander sur WhatsApp"
                      message="Bonjour Legend Farm, je voudrais passer une commande."
                    />
                    <Button asChild variant="outline">
                      <Link href="/contact">Nous contacter</Link>
                    </Button>
                  </div>
                </div>
              )
            ) : (
              <div className="mx-auto max-w-sm space-y-4">
                <p className="font-serif text-2xl">Boutique non configuree</p>
                <p className="text-sm leading-7 text-muted-foreground">
                  La connexion a la base de donnees n est pas encore configuree.
                  Renseignez les variables d environnement Supabase pour publier
                  les produits.
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  )
}
