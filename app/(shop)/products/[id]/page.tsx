import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getProductById } from '@/lib/actions/products'
import { formatCurrency } from '@/lib/utils'

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { isConfigured, product } = await getProductById(id)

  if (!product) {
    return (
      <main className="container py-12">
        <EmptyState
          title={isConfigured ? 'Produit introuvable' : 'Supabase n est pas encore configure'}
          description={
            isConfigured
              ? 'Ce produit n existe pas encore ou n est pas disponible publiquement.'
              : 'Connectez Supabase puis ajoutez vos produits dans l admin.'
          }
        />
      </main>
    )
  }

  return (
    <main className="container grid gap-8 py-12 lg:grid-cols-[1fr_0.8fr]">
      <Card className="overflow-hidden">
        <div className="h-72 bg-[radial-gradient(circle_at_top,_rgba(215,236,197,0.95),_rgba(255,255,255,0.6))]" />
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-4xl">{product.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{product.description ?? 'Description a completer.'}</p>
          <div className="grid gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Categorie</span>
              <span>{product.category}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Unite</span>
              <span>{product.unit}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Prix de base</span>
              <span>{formatCurrency(product.base_price)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Disponibilite</span>
              <span>{product.is_available ? 'Disponible' : 'Indisponible'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
