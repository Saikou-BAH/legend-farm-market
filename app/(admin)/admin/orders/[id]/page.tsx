import { OrderManagementPanel } from '@/components/admin/order-management-panel'
import { OrderInvoice } from '@/components/admin/order-invoice'
import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OrderStatusBadge } from '@/components/admin/order-status-badge'
import { OrderPaymentManager } from '@/components/admin/order-payment-manager'
import { OrderTimeline } from '@/components/shop/order-timeline'
import { getAdminOrderDetailsById } from '@/lib/actions/orders'
import { getPublicShopProfile } from '@/lib/actions/shop'
import {
  getDeliveryTypeLabel,
  getOrderStatusLabel,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
} from '@/lib/order-display'
import { adminAccessMessages } from '@/lib/shop-data'
import { formatDateTime, formatGNF } from '@/lib/utils'

export default async function AdminOrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [{ access, order }, shopProfile] = await Promise.all([
    getAdminOrderDetailsById(id),
    getPublicShopProfile(),
  ])

  if (access.status !== 'ready') {
    const state = adminAccessMessages[access.status]

    return <EmptyState title={state.title} description={state.description} />
  }

  if (!order) {
    return (
      <EmptyState
        title="Commande introuvable"
        description="Cette commande n est pas disponible dans le contexte admin actuel."
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
            <span className="text-muted-foreground">Client</span>
            <span className="text-right">
              {order.customer_name ?? order.guest_name ?? 'Non renseigné'}
              {order.guest_name && (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  Invité
                </span>
              )}
            </span>
          </div>
          {order.guest_phone && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Téléphone</span>
              <span className="text-right">{order.guest_phone}</span>
            </div>
          )}
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Email</span>
            <span className="text-right">{order.customer_email ?? 'Non renseigné'}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Date</span>
            <span className="text-right">{formatDateTime(order.created_at)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Paiement</span>
            <span className="text-right">{getPaymentStatusLabel(order.payment_status)}</span>
          </div>
          <div className="border-t border-border/60 pt-2 space-y-2">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Sous-total</span>
              <span className="text-right">{formatGNF(order.subtotal)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Remise promo</span>
                <span className="text-right text-green-700">− {formatGNF(order.discount_amount)}</span>
              </div>
            )}
            {order.admin_discount > 0 && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Réduction admin</span>
                <span className="text-right text-green-700">− {formatGNF(order.admin_discount)}</span>
              </div>
            )}
            {order.delivery_fee > 0 && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Livraison</span>
                <span className="text-right">{formatGNF(order.delivery_fee)}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-4 font-semibold">
              <span>Total</span>
              <span className="text-right">{formatGNF(order.total_amount)}</span>
            </div>
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

      <Card>
        <CardHeader>
          <CardTitle>Logistique</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Type</span>
            <span className="text-right">{getDeliveryTypeLabel(order.delivery_type)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Zone</span>
            <span className="text-right">{order.delivery_zone ?? 'Non renseignee'}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Creneau</span>
            <span className="text-right">{order.delivery_slot ?? 'Non renseigne'}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Paiement</span>
            <span className="text-right">{getPaymentMethodLabel(order.payment_method)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="mb-1 font-medium">Notes client</p>
            <p className="text-muted-foreground">{order.customer_notes ?? 'Aucune note client.'}</p>
          </div>
          <div>
            <p className="mb-1 font-medium">Notes admin</p>
            <p className="text-muted-foreground">{order.admin_notes ?? 'Aucune note admin.'}</p>
          </div>
        </CardContent>
      </Card>

      <OrderManagementPanel order={order} />

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
                    <p className="text-muted-foreground">
                      Alveoles: {item.alveoles_quantity} ({item.alveoles_option})
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

      <OrderPaymentManager
        orderId={order.id}
        orderReference={order.reference}
        orderTotal={order.total_amount}
        paymentMethod={order.payment_method}
        paymentStatus={order.payment_status}
        paymentTransactions={order.paymentTransactions}
        orderStatusLabel={getOrderStatusLabel(order.status)}
      />

      <div className="xl:col-span-2">
        <OrderInvoice
          order={order}
          shopName={shopProfile.shopName}
          shopPhone={shopProfile.shopPhone ?? undefined}
        />
      </div>
    </div>
  )
}
