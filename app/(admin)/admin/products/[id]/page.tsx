import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getProductById } from '@/lib/actions/products'
import { formatCurrency } from '@/lib/utils'

export default async function AdminProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { isConfigured, product } = await getProductById(id)

  if (!product) {
    return (
      <EmptyState
        title={isConfigured ? 'Produit introuvable' : 'Supabase n est pas configure'}
        description="Cette fiche admin sera alimentee des que les donnees produit seront disponibles."
      />
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{product.name}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Categorie</span>
          <span>{product.category}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Prix de base</span>
          <span>{formatCurrency(product.base_price)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Stock</span>
          <span>{product.stock_quantity}</span>
        </div>
      </CardContent>
    </Card>
  )
}
