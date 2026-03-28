import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAdminLoyaltySettings } from '@/lib/actions/loyalty'
import { adminAccessMessages } from '@/lib/shop-data'

export default async function AdminLoyaltyPage() {
  const { access, settings } = await getAdminLoyaltySettings()

  if (access.status !== 'ready') {
    const state = adminAccessMessages[access.status]

    return <EmptyState title={state.title} description={state.description} />
  }

  const loyaltySettings = settings.filter((setting) => setting.key.startsWith('loyalty_'))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fidelite</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loyaltySettings.length > 0 ? (
          loyaltySettings.map((setting) => (
            <div key={setting.id} className="rounded-2xl border border-border/70 p-4">
              <p className="font-medium">{setting.key}</p>
              <p className="mt-1 text-sm text-muted-foreground">{setting.value}</p>
            </div>
          ))
        ) : (
          <EmptyState
            title="Aucun parametre fidelite"
            description="Les seuils et la logique de points apparaitront ici une fois configures."
          />
        )}
      </CardContent>
    </Card>
  )
}
