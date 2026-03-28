import Link from 'next/link'
import { OrderTimeline } from '@/components/shop/order-timeline'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { getCustomerOrderById } from '@/lib/actions/orders'
import {
  getDeliveryTypeLabel,
  getOrderStatusLabel,
  getPaymentStatusLabel,
} from '@/lib/order-display'
import { formatDateTime, formatGNF } from '@/lib/utils'

export default async function TrackOrderPage({
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
          title="Suivi indisponible"
          description="Ajoutez la configuration Supabase pour consulter le statut reel des commandes."
        />
      </main>
    )
  }

  if (!isAuthenticated || !order) {
    return (
      <main className="container py-12">
        <EmptyState
          title="Commande introuvable"
          description="Cette commande nest pas accessible avec le compte actuellement connecte."
        />
      </main>
    )
  }

  return (
    <main className="container py-12">
      <div className="mx-auto grid max-w-5xl gap-6 xl:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-4xl">Suivi de commande</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.25rem] border border-border/70 bg-muted/15 p-4 text-sm">
                <p className="text-muted-foreground">Reference</p>
                <p className="mt-1 font-medium">{order.reference}</p>
              </div>
              <div className="rounded-[1.25rem] border border-border/70 bg-muted/15 p-4 text-sm">
                <p className="text-muted-foreground">Statut actuel</p>
                <p className="mt-1 font-medium">{getOrderStatusLabel(order.status)}</p>
              </div>
              <div className="rounded-[1.25rem] border border-border/70 bg-muted/15 p-4 text-sm">
                <p className="text-muted-foreground">Livraison</p>
                <p className="mt-1 font-medium">{getDeliveryTypeLabel(order.delivery_type)}</p>
                <p className="mt-1 text-muted-foreground">
                  {order.delivery_zone ?? 'Zone non renseignee'}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-border/70 bg-muted/15 p-4 text-sm">
                <p className="text-muted-foreground">Paiement</p>
                <p className="mt-1 font-medium">{getPaymentStatusLabel(order.payment_status)}</p>
                <p className="mt-1 text-muted-foreground">{formatGNF(order.total_amount)}</p>
              </div>
            </div>

            <Card className="border-border/60 bg-muted/10">
              <CardContent className="p-5">
                <OrderTimeline status={order.status} />
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.25rem] border border-border/70 bg-muted/15 p-4 text-sm">
                <p className="text-muted-foreground">Commande creee le</p>
                <p className="mt-1 font-medium">{formatDateTime(order.created_at)}</p>
              </div>
              <div className="rounded-[1.25rem] border border-border/70 bg-muted/15 p-4 text-sm">
                <p className="text-muted-foreground">Creneau</p>
                <p className="mt-1 font-medium">{order.delivery_slot ?? 'A confirmer'}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link href={`/account/orders/${order.id}`}>Voir le detail complet</Link>
              </Button>
              <Button asChild>
                <Link href="/products">Continuer mes achats</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ce qui se passe ensuite</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              L equipe Legend Farm confirme d abord la commande et les conditions de livraison.
            </p>
            <p>
              Une fois confirmee, la commande passe en preparation avant eventuelle mise en
              livraison.
            </p>
            <p>
              Cette page suivra automatiquement les changements de statut a chaque
              actualisation.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
