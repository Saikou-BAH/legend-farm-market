import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OrderTimeline } from '@/components/shop/order-timeline'
import { getOrdersAdminList } from '@/lib/actions/orders'
import { adminAccessMessages } from '@/lib/shop-data'
import { formatCurrency, formatDateTime } from '@/lib/utils'

export default async function AdminOrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { access, orders } = await getOrdersAdminList()

  if (access.status !== 'ready') {
    const state = adminAccessMessages[access.status]

    return <EmptyState title={state.title} description={state.description} />
  }

  const order = orders.find((item) => item.id === id)

  if (!order) {
    return (
      <EmptyState
        title="Commande introuvable"
        description="Cette commande n est pas disponible dans le contexte admin actuel."
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
            <span className="text-muted-foreground">Client</span>
            <span>{order.customer_name ?? 'Client non renseigne'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Date</span>
            <span>{formatDateTime(order.created_at)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Montant</span>
            <span>{formatCurrency(order.total_amount)}</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Progression</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderTimeline status={order.status} />
        </CardContent>
      </Card>
    </div>
  )
}
