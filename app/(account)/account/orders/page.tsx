import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { getCustomerOrders } from '@/lib/actions/orders'
import { formatCurrency, formatDateTime } from '@/lib/utils'

export default async function AccountOrdersPage() {
  const { isAuthenticated, isConfigured, orders } = await getCustomerOrders()

  if (!isConfigured) {
    return (
      <EmptyState
        title="Supabase n est pas encore configure"
        description="Ajoutez les variables d environnement du projet pour charger l historique reel des commandes."
      />
    )
  }

  if (!isAuthenticated) {
    return (
      <EmptyState
        title="Connexion requise"
        description="Connectez-vous avec un compte client pour consulter vos commandes et retours."
      />
    )
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        title="Aucune commande pour le moment"
        description="Les futures commandes passees depuis la boutique apparaitront ici avec leur statut et leur montant reels."
      />
    )
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Link key={order.id} href={`/account/orders/${order.id}`}>
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
              <div>
                <p className="font-medium">{order.reference}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDateTime(order.created_at)}
                </p>
              </div>
              <p className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                {order.status}
              </p>
              <p className="font-semibold">{formatCurrency(order.total_amount)}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
