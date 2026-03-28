import { ProductEditor } from '@/components/admin/product-editor'
import { ProductMediaManager } from '@/components/admin/product-media-manager'
import { ProductReviewModeration } from '@/components/admin/product-review-moderation'
import { StockNotificationManager } from '@/components/admin/stock-notification-manager'
import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAdminProductById } from '@/lib/actions/products'
import { getAdminProductReviews } from '@/lib/actions/reviews'
import { adminAccessMessages } from '@/lib/shop-data'
import { formatDateTime, formatGNF } from '@/lib/utils'

export default async function AdminProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [{ access, product }, reviewsState] = await Promise.all([
    getAdminProductById(id),
    getAdminProductReviews(id),
  ])

  if (access.status !== 'ready') {
    const state = adminAccessMessages[access.status]
    return <EmptyState title={state.title} description={state.description} />
  }

  if (!product) {
    return (
      <EmptyState
        title="Produit introuvable"
        description="Cette fiche admin sera alimentee des que les donnees produit seront disponibles."
      />
    )
  }

  const priceTiers = [
    {
      label: 'Palier 1',
      quantity: product.price_tier_1_qty,
      price: product.price_tier_1_price,
    },
    {
      label: 'Palier 2',
      quantity: product.price_tier_2_qty,
      price: product.price_tier_2_price,
    },
    {
      label: 'Palier 3',
      quantity: product.price_tier_3_qty,
      price: product.price_tier_3_price,
    },
  ].filter((tier) => tier.quantity !== null && tier.price !== null)

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
      <ProductEditor product={product} />

      <Card>
        <CardHeader>
          <CardTitle>Tarification et suivi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="space-y-3">
            <p className="font-medium">Paliers de prix</p>
            {priceTiers.length > 0 ? (
              priceTiers.map((tier) => (
                <div
                  key={tier.label}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 px-4 py-3"
                >
                  <span className="text-muted-foreground">{tier.label}</span>
                  <span className="text-right">
                    A partir de {tier.quantity} unites: {formatGNF(tier.price ?? 0)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">Aucun palier de prix n est configure pour ce produit.</p>
            )}
          </div>

          <div className="space-y-2 rounded-2xl border border-border/70 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Cree le</span>
              <span className="text-right">{formatDateTime(product.created_at)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Mis a jour le</span>
              <span className="text-right">{formatDateTime(product.updated_at)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <ProductMediaManager
        productId={product.id}
        productName={product.name}
        images={product.images}
      />

      <StockNotificationManager productId={product.id} productName={product.name} />

      <ProductReviewModeration
        productName={product.name}
        reviews={reviewsState.reviews}
      />
    </div>
  )
}
