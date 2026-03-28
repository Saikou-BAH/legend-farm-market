import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getDeliveryZonesAdminList } from '@/lib/actions/delivery'
import { adminAccessMessages } from '@/lib/shop-data'
import { formatCurrency } from '@/lib/utils'

export default async function AdminDeliveriesPage() {
  const { access, zones } = await getDeliveryZonesAdminList()

  if (access.status !== 'ready') {
    const state = adminAccessMessages[access.status]

    return <EmptyState title={state.title} description={state.description} />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Zones et livraison</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {zones.length > 0 ? (
          zones.map((zone) => (
            <div
              key={zone.id}
              className="grid gap-2 rounded-2xl border border-border/70 p-4 md:grid-cols-[1fr_0.6fr_0.6fr]"
            >
              <p className="font-medium">{zone.name}</p>
              <p className="text-sm text-muted-foreground">
                {zone.estimated_delay ?? 'Delai a definir'}
              </p>
              <p className="font-medium">{formatCurrency(zone.delivery_fee)}</p>
            </div>
          ))
        ) : (
          <EmptyState
            title="Aucune zone de livraison"
            description="Configurez vos zones et frais dans l admin pour calculer les livraisons reelles."
          />
        )}
      </CardContent>
    </Card>
  )
}
