import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAdminLoyaltySettings } from '@/lib/actions/loyalty'
import { adminAccessMessages } from '@/lib/shop-data'

export default async function AdminLoyaltyPage() {
  const { access, recentTransactions, settings } = await getAdminLoyaltySettings()

  if (access.status !== 'ready') {
    const state = adminAccessMessages[access.status]

    return <EmptyState title={state.title} description={state.description} />
  }

  const loyaltySettings = settings.filter((setting) => setting.key.startsWith('loyalty_'))

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
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

      <Card>
        <CardHeader>
          <CardTitle>Mouvements recents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((transaction) => (
              <div key={transaction.id} className="rounded-2xl border border-border/70 p-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium">{transaction.type}</p>
                  <p className={transaction.points >= 0 ? 'font-medium text-primary' : 'font-medium'}>
                    {transaction.points >= 0 ? '+' : ''}
                    {transaction.points}
                  </p>
                </div>
                <p className="mt-1 text-muted-foreground">
                  {transaction.description ?? 'Aucune description.'}
                </p>
                <p className="mt-2 text-muted-foreground">
                  Client: {transaction.customer_id} - Solde: {transaction.balance_after}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucun mouvement fidelite recent a afficher.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
