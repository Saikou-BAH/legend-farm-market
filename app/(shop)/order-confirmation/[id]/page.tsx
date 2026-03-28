import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { OrderTimeline } from '@/components/shop/order-timeline'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { getCustomerOrderById } from '@/lib/actions/orders'
import {
  getDeliveryTypeLabel,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
} from '@/lib/order-display'
import { formatDateTime, formatGNF } from '@/lib/utils'

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { isAuthenticated, isConfigured, order } = await getCustomerOrderById(id)

  if (!isConfigured) {
    return (
      <main className="container py-12">
        <EmptyState
          title="Confirmation indisponible"
          description="Ajoutez la configuration Supabase pour relier cette page a une vraie commande."
        />
      </main>
    )
  }

  if (!isAuthenticated || !order) {
    return (
      <main className="container py-12">
        <EmptyState
          title="Commande introuvable"
          description="Cette confirmation nest pas accessible avec le compte actuellement connecte."
        />
      </main>
    )
  }

  return (
    <main className="container py-12">
      <div className="mx-auto grid max-w-5xl gap-6 xl:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <CardTitle className="font-serif text-4xl">Commande enregistree</CardTitle>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Votre commande <span className="font-medium text-foreground">{order.reference}</span>{' '}
                a bien ete creee. Elle reste en attente de confirmation par l equipe Legend Farm.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.25rem] border border-border/70 bg-muted/15 p-4 text-sm">
                <p className="text-muted-foreground">Date de creation</p>
                <p className="mt-1 font-medium">{formatDateTime(order.created_at)}</p>
              </div>
              <div className="rounded-[1.25rem] border border-border/70 bg-muted/15 p-4 text-sm">
                <p className="text-muted-foreground">Montant total</p>
                <p className="mt-1 font-medium">{formatGNF(order.total_amount)}</p>
              </div>
              <div className="rounded-[1.25rem] border border-border/70 bg-muted/15 p-4 text-sm">
                <p className="text-muted-foreground">Livraison</p>
                <p className="mt-1 font-medium">{getDeliveryTypeLabel(order.delivery_type)}</p>
                {order.delivery_zone ? (
                  <p className="mt-1 text-muted-foreground">{order.delivery_zone}</p>
                ) : null}
              </div>
              <div className="rounded-[1.25rem] border border-border/70 bg-muted/15 p-4 text-sm">
                <p className="text-muted-foreground">Paiement</p>
                <p className="mt-1 font-medium">{getPaymentMethodLabel(order.payment_method)}</p>
                <p className="mt-1 text-muted-foreground">
                  Statut: {getPaymentStatusLabel(order.payment_status)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href={`/track/${order.id}`}>Suivre cette commande</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/account/orders/${order.id}`}>Voir le detail complet</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Suivi initial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <OrderTimeline status={order.status} />
            <div className="rounded-[1.25rem] border border-border/70 bg-muted/15 p-4 text-sm text-muted-foreground">
              L equipe Legend Farm verifiera la disponibilite finale, puis confirmera la
              commande et le mode de paiement avant preparation.
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
