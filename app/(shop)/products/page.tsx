import { ProductCard } from '@/components/shop/product-card'
import { EmptyState } from '@/components/ui/empty-state'
import { getProductsCatalog } from '@/lib/actions/products'

export default async function ProductsPage() {
  const { isConfigured, products } = await getProductsCatalog()

  return (
    <main className="container space-y-10 py-12">
      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Catalogue
        </p>
        <div className="space-y-3">
          <h1 className="font-serif text-5xl">Catalogue Legend Farm</h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Premiere structure du catalogue avec focus sur les produits a forte rotation,
            les packs et la logique B2B/B2C.
          </p>
        </div>
      </div>

      {products.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              name={product.name}
              category={product.category}
              unit={product.unit}
              price={product.base_price}
              description={product.description}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={
            isConfigured ? 'Le catalogue est encore vide' : 'Supabase n est pas encore relie'
          }
          description={
            isConfigured
              ? 'Ajoutez vos premiers produits depuis le back-office pour publier la boutique.'
              : 'Renseignez les variables Supabase puis creez les produits dans l administration.'
          }
        />
      )}
    </main>
  )
}
