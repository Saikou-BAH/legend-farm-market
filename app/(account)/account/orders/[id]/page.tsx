import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OrderTimeline } from '@/components/shop/order-timeline'
import { getCustomerOrderById } from '@/lib/actions/orders'
import { formatCurrency, formatDateTime } from '@/lib/utils'

export default async function AccountOrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { isAuthenticated, isConfigured, order } = await getCustomerOrderById(id)

  if (!isConfigured) {
    return (
      <EmptyState
        title="Supabase n est pas encore configure"
        description="Ajoutez la configuration Supabase pour lire les commandes reelles."
      />
    )
  }

  if (!isAuthenticated || !order) {
    return (
      <EmptyState
        title="Commande introuvable"
        description="Cette commande n est pas accessible avec le compte actuellement connecte."
      />
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
      <Card>
        <CardHeader>
          <CardTitle>{order.reference}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Creee le</span>
            <span>{formatDateTime(order.created_at)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Paiement</span>
            <span>{order.payment_status}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total</span>
            <span>{formatCurrency(order.total_amount)}</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Suivi</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderTimeline status={order.status} />
        </CardContent>
      </Card>
    </div>
  )
}
