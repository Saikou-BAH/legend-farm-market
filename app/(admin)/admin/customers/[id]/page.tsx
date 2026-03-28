import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { CustomerManagementPanel } from '@/components/admin/customer-management-panel'
import { OrderStatusBadge } from '@/components/admin/order-status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCustomerProfileById } from '@/lib/actions/customers'
import { getAdminCustomerOrders } from '@/lib/actions/admin-customers'
import { adminAccessMessages } from '@/lib/shop-data'
import { formatDateTime, formatGNF } from '@/lib/utils'
import type { OrderStatus } from '@/types'

export default async function AdminCustomerDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [{ access, customer }, ordersResult] = await Promise.all([
    getCustomerProfileById(id),
    getAdminCustomerOrders(id),
  ])

  if (access.status !== 'ready') {
    const state = adminAccessMessages[access.status]
    return <EmptyState title={state.title} description={state.description} />
  }

  if (!customer) {
    return (
      <EmptyState
        title="Client introuvable"
        description="Aucun client ne correspond a cet identifiant dans la base actuelle."
      />
    )
  }

  const orders = ordersResult.success ? ordersResult.data : []

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <CustomerManagementPanel customer={customer} />

        <Card>
          <CardHeader>
            <CardTitle>Suivi du profil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="rounded-2xl border border-border/70 px-4 py-3">
              <p className="mb-1 font-medium">Notes</p>
              <p className="text-muted-foreground">{customer.notes ?? 'Aucune note pour ce client.'}</p>
            </div>
            <div className="rounded-2xl border border-border/70 px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Cree le</span>
                <span className="text-right">{formatDateTime(customer.created_at)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Mis a jour le</span>
                <span className="text-right">{formatDateTime(customer.updated_at)}</span>
              </div>
            </div>
            <div className="rounded-2xl border border-border/70 px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Commandes totales</span>
                <span className="font-semibold">{orders.length}</span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Total depense</span>
                <span className="font-semibold text-primary">
                  {formatGNF(orders.reduce((sum, o) => sum + o.total_amount, 0))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <CardTitle>Historique des commandes</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Aucune commande enregistree pour ce client.
            </p>
          ) : (
            <div className="space-y-2">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="grid items-center gap-3 rounded-2xl border border-border/70 px-4 py-3 text-sm hover:bg-muted/40 sm:grid-cols-[auto_1fr_auto_auto_auto]"
                >
                  <span className="font-mono font-semibold text-primary">{order.reference}</span>
                  <span className="text-muted-foreground">
                    {order.items_count} article{order.items_count > 1 ? 's' : ''} &mdash;{' '}
                    {order.delivery_type === 'pickup' ? 'Retrait' : 'Livraison'}
                  </span>
                  <OrderStatusBadge status={order.status as OrderStatus} />
                  <span className="font-semibold">{formatGNF(order.total_amount)}</span>
                  <span className="text-right text-xs text-muted-foreground">
                    {formatDateTime(order.created_at)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
