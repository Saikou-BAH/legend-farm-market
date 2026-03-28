import { StatsCard } from '@/components/admin/stats-card'
import { OrderStatusBadge } from '@/components/admin/order-status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAdminDashboardData } from '@/lib/actions/admin-shop'
import { adminAccessMessages } from '@/lib/shop-data'
import { formatCurrency, formatDateTime } from '@/lib/utils'

export default async function AdminDashboardPage() {
  const {
    access,
    activePromotionsCount,
    customersCount,
    ordersTodayCount,
    productsCount,
    recentOrders,
  } = await getAdminDashboardData()

  if (access.status !== 'ready') {
    const state = adminAccessMessages[access.status]

    return <EmptyState title={state.title} description={state.description} />
  }

  const stats = [
    {
      label: 'Produits actifs',
      value: `${productsCount}`,
      detail: 'Catalogue pilote depuis Supabase',
    },
    {
      label: 'Commandes du jour',
      value: `${ordersTodayCount}`,
      detail: 'Compteur mis a jour a partir des commandes du jour',
    },
    {
      label: 'Clients',
      value: `${customersCount}`,
      detail: 'Profils clients rattaches au shop',
    },
    {
      label: 'Promotions actives',
      value: `${activePromotionsCount}`,
      detail: 'Offres actuellement actives en base',
    },
  ]

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <StatsCard key={item.label} {...item} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Flux commandes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentOrders.length > 0 ? (
            recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 p-4"
              >
                <div>
                  <p className="font-medium">{order.reference}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.customer_name ?? 'Client non renseigne'} •{' '}
                    {formatDateTime(order.created_at)}
                  </p>
                </div>
                <OrderStatusBadge status={order.status} />
                <p className="font-semibold">{formatCurrency(order.total_amount)}</p>
              </div>
            ))
          ) : (
            <EmptyState
              title="Aucune commande recente"
              description="Les nouvelles commandes du shop apparaitront ici des qu elles seront creees."
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
