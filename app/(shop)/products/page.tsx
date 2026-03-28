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
    <main className="container space-y-10 py-12">
      <section className="space-y-5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Boutique
        </p>
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="space-y-3">
            <h1 className="font-serif text-5xl">Catalogue Legend Farm</h1>
            <p className="max-w-3xl text-lg text-muted-foreground">
              Parcourez les produits disponibles, filtrez par categorie et consultez des tarifs clairs en GNF avant l activation du panier complet.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{totalCount} produits publics</Badge>
            <Badge variant="outline">{resultCount} resultat(s)</Badge>
            {activeFilters.category ? <Badge>{activeFilters.category}</Badge> : null}
          </div>
        </div>
      </section>

      <Card className="border-border/60">
        <CardContent className="space-y-6 p-6">
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
                  <Link href={buildCatalogHref(activeFilters.search, category)}>{category}</Link>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

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

      {isConfigured && hasActiveFilters ? (
        <Card className="border-dashed">
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
      ) : null}
    </main>
  )
}
