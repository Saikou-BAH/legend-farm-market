import { ProductCard } from '@/components/shop/product-card'
import { EmptyState } from '@/components/ui/empty-state'
import { getAdminProducts } from '@/lib/actions/admin-shop'
import { adminAccessMessages } from '@/lib/shop-data'

export default async function AdminProductsPage() {
  const { access, products } = await getAdminProducts()

  if (access.status !== 'ready') {
    const state = adminAccessMessages[access.status]

    return <EmptyState title={state.title} description={state.description} />
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-serif text-3xl">Produits</h2>
        <p className="text-muted-foreground">
          Base de gestion catalogue, stock visible, mise en avant et logique de paliers prix.
        </p>
      </div>

      {products.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
          title="Aucun produit en base"
          description="Creez vos produits depuis le back-office pour commencer a publier le catalogue."
        />
      )}
    </div>
  )
}
