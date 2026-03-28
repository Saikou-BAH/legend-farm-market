import Link from 'next/link'
import { OrderStatusBadge } from '@/components/admin/order-status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getOrdersAdminList } from '@/lib/actions/orders'
import { adminAccessMessages } from '@/lib/shop-data'
import { formatDateTime, formatGNF } from '@/lib/utils'

export default async function AdminOrdersPage() {
  const { access, orders } = await getOrdersAdminList()

  if (access.status !== 'ready') {
    const state = adminAccessMessages[access.status]

    return <EmptyState title={state.title} description={state.description} />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Commandes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {orders.length > 0 ? (
          orders.map((order) => (
            <Link key={order.id} href={`/admin/orders/${order.id}`}>
              <div className="grid gap-2 rounded-2xl border border-border/70 p-4 md:grid-cols-[1.1fr_0.7fr_0.5fr]">
                <div>
                  <p className="font-medium">{order.reference}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.customer_name ?? 'Client non renseigne'} •{' '}
                    {formatDateTime(order.created_at)}
                  </p>
                </div>
                <OrderStatusBadge status={order.status} />
                <p className="font-semibold">{formatGNF(order.total_amount)}</p>
              </div>
            </Link>
          ))
        ) : (
          <EmptyState
            title="Aucune commande pour l instant"
            description="Les commandes creees depuis la boutique apparaitront ici avec leur statut et leur total reels."
          />
        )}
      </CardContent>
    </Card>
  )
}
