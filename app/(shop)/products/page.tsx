import type { Metadata } from 'next'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { ProductCard } from '@/components/shop/product-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { getProductsCatalog } from '@/lib/actions/products'

export const metadata: Metadata = {
  title: 'Catalogue',
  description:
    'Consultez les produits fermiers Legend Farm, leurs prix en GNF et leur disponibilite actuelle.',
}

function getSearchParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

function buildCatalogHref(search: string | null, category: string | null) {
  const params = new URLSearchParams()

  if (search) {
    params.set('search', search)
  }

  if (category) {
    params.set('category', category)
  }

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

  return (
    <main className="pb-20">
      <section className="container pt-8 md:pt-12">
        <div className="surface-panel section-grid relative overflow-hidden rounded-[2.4rem] px-6 py-8 md:px-10 md:py-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(184,226,127,0.18),transparent_30%),radial-gradient(circle_at_85%_15%,rgba(138,194,255,0.14),transparent_24%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="space-y-4">
              <Badge variant="secondary">Catalogue premium</Badge>
              <div className="space-y-3">
                <h1 className="font-serif text-5xl leading-tight md:text-6xl">
                  Des produits fermiers presentes avec plus de desirabilite.
                </h1>
                <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
                  Parcourez les references disponibles, filtrez par categorie et
                  consultez des tarifs clairs en GNF dans une vitrine plus lisible,
                  plus rassurante et plus orientee conversion.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Card className="bg-white/72">
                <CardContent className="p-5">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Produits
                  </p>
                  <p className="mt-3 font-serif text-3xl">{totalCount}</p>
                  <p className="mt-1 text-sm text-muted-foreground">references visibles</p>
                </CardContent>
              </Card>
              <Card className="bg-white/72">
                <CardContent className="p-5">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Resultats
                  </p>
                  <p className="mt-3 font-serif text-3xl">{resultCount}</p>
                  <p className="mt-1 text-sm text-muted-foreground">apres filtrage</p>
                </CardContent>
              </Card>
              <Card className="bg-white/72">
                <CardContent className="p-5">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Lecture
                  </p>
                  <p className="mt-3 font-serif text-3xl">GNF</p>
                  <p className="mt-1 text-sm text-muted-foreground">prix standardises</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="container pt-8">
        <Card className="surface-panel border-white/80">
          <CardContent className="space-y-6 p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{totalCount} produits publics</Badge>
              <Badge variant="outline">{resultCount} resultat(s)</Badge>
              {activeFilters.category ? <Badge>{activeFilters.category}</Badge> : null}
              {activeFilters.search ? <Badge variant="secondary">{activeFilters.search}</Badge> : null}
            </div>

            <form action="/products" className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="space-y-2">
                <label htmlFor="catalog-search" className="text-sm font-medium">
                  Rechercher un produit
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="catalog-search"
                    name="search"
                    placeholder="Oeufs, poulet, pack, ferme..."
                    defaultValue={activeFilters.search ?? ''}
                    className="pl-11"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {activeFilters.category ? (
                  <input type="hidden" name="category" value={activeFilters.category} />
                ) : null}
                <Button type="submit">Appliquer les filtres</Button>
                {hasActiveFilters ? (
                  <Button asChild variant="outline">
                    <Link href="/products">Reinitialiser</Link>
                  </Button>
                ) : null}
              </div>
            </form>

            <div className="space-y-3">
              <p className="text-sm font-medium">Filtrer par categorie</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  asChild
                  size="sm"
                  variant={!activeFilters.category ? 'default' : 'outline'}
                >
                  <Link href={buildCatalogHref(activeFilters.search, null)}>Toutes</Link>
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
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="container pt-8">
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
          <EmptyState
            title={
              isConfigured
                ? hasActiveFilters
                  ? 'Aucun produit ne correspond a votre recherche'
                  : 'Le catalogue est encore vide'
                : 'Supabase n est pas encore relie'
            }
            description={
              isConfigured
                ? hasActiveFilters
                  ? 'Essayez une autre recherche, retirez un filtre ou republiez davantage de produits depuis le back-office.'
                  : 'Ajoutez vos premiers produits depuis le back-office pour publier la boutique.'
                : 'Renseignez les variables Supabase puis creez les produits dans l administration.'
            }
          />
        )}
      </section>

      {isConfigured && hasActiveFilters ? (
        <section className="container pt-8">
          <Card className="border-dashed border-border/70 bg-white/60">
            <CardContent className="flex flex-col gap-3 p-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
              <p>
                {resultCount === 0
                  ? 'Aucun produit public ne correspond aux filtres actifs.'
                  : `${resultCount} produit(s) correspondent a vos filtres sur ${totalCount} produits publics.`}
              </p>
              <Button asChild variant="ghost" size="sm">
                <Link href="/products">Voir tout le catalogue</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      ) : null}
    </main>
  )
}
