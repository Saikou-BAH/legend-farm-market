import { StatsCard } from '@/components/admin/stats-card'
import { OrderStatusBadge } from '@/components/admin/order-status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAdminDashboardData } from '@/lib/actions/admin-shop'
import { adminAccessMessages } from '@/lib/shop-data'
import { formatDateTime, formatGNF } from '@/lib/utils'

export default async function AdminDashboardPage() {
  const {
    access,
    activePromotionsCount,
    customersCount,
    ordersTodayCount,
    productsCount,
    recentActivity,
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
      detail: 'Catalogue piloté depuis Supabase',
    },
    {
      label: 'Commandes du jour',
      value: `${ordersTodayCount}`,
      detail: "Commandes reçues aujourd'hui",
    },
    {
      label: 'Clients',
      value: `${customersCount}`,
      detail: 'Profils clients rattachés au shop',
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

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
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
                      {order.customer_name ?? 'Client non renseigné'} •{' '}
                      {formatDateTime(order.created_at)}
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                  <p className="font-semibold">{formatGNF(order.total_amount)}</p>
                </div>
              ))
            ) : (
              <EmptyState
                title="Aucune commande récente"
                description="Les nouvelles commandes apparaîtront ici dès qu'elles seront créées."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historique admin recent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-2xl border border-border/70 p-4"
                >
                  <p className="font-medium">{entry.summary}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {entry.staff_name ?? 'Staff inconnu'} • {formatDateTime(entry.created_at)}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState
                title="Aucune opération journalisée"
                description="Les mutations admin critiques apparaîtront ici après application de la migration d'audit."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
