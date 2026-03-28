import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OrderStatusBadge } from '@/components/admin/order-status-badge'
import { OrderPaymentSummary } from '@/components/shop/order-payment-summary'
import { OrderTimeline } from '@/components/shop/order-timeline'
import { getCustomerOrderById } from '@/lib/actions/orders'
import {
  getDeliveryTypeLabel,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
} from '@/lib/order-display'
import { formatDateTime, formatGNF } from '@/lib/utils'

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
    <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle>{order.reference}</CardTitle>
            <OrderStatusBadge status={order.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Creee le</span>
            <span className="text-right">{formatDateTime(order.created_at)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Livraison</span>
            <span className="text-right">{getDeliveryTypeLabel(order.delivery_type)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Zone</span>
            <span className="text-right">{order.delivery_zone ?? 'Non renseignee'}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Paiement</span>
            <span className="text-right">{getPaymentStatusLabel(order.payment_status)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Mode de paiement</span>
            <span className="text-right">{getPaymentMethodLabel(order.payment_method)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Total</span>
            <span className="text-right font-medium">{formatGNF(order.total_amount)}</span>
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

      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Articles commandes</CardTitle>
        </CardHeader>
        <CardContent>
          {order.items.length > 0 ? (
            <div className="space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 rounded-2xl border border-border/70 px-4 py-3 text-sm md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-muted-foreground">
                      {item.quantity} x {item.product_unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground">Unitaire: {formatGNF(item.unit_price)}</p>
                    <p className="font-medium">{formatGNF(item.total_price)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucune ligne de commande n est encore rattachee a cette commande.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="xl:col-span-2">
        <OrderPaymentSummary
          paymentMethod={order.payment_method}
          paymentStatus={order.payment_status}
          totalAmount={order.total_amount}
          paymentTransactions={order.paymentTransactions}
          title="Suivi du paiement"
        />
      </div>
    </div>
  )
}
