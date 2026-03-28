import { LoyaltyBadge } from '@/components/shop/loyalty-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCustomerLoyaltySnapshot } from '@/lib/actions/loyalty'

export default async function AccountLoyaltyPage() {
  const { isAuthenticated, isConfigured, profile, transactions } =
    await getCustomerLoyaltySnapshot()

  if (!isConfigured || !isAuthenticated || !profile) {
    return (
      <EmptyState
        title="Programme fidelite indisponible"
        description="Connectez-vous avec un profil client actif pour suivre vos points et votre niveau."
      />
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fidelite</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <LoyaltyBadge level={profile.loyalty_level} />
          <p className="font-serif text-4xl">{profile.loyalty_points}</p>
          <p className="text-sm text-muted-foreground">
            Vos points et votre niveau sont synchronises depuis Supabase, y compris les achats
            livres et les points utilises au checkout.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historique recent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <div key={transaction.id} className="rounded-2xl border border-border/70 p-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium">{transaction.type}</p>
                  <p className={transaction.points >= 0 ? 'font-medium text-primary' : 'font-medium'}>
                    {transaction.points >= 0 ? '+' : ''}
                    {transaction.points}
                  </p>
                </div>
                <p className="mt-1 text-muted-foreground">
                  {transaction.description ?? 'Aucune description complementaire.'}
                </p>
                <p className="mt-2 text-muted-foreground">
                  Solde apres mouvement: {transaction.balance_after}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucun mouvement fidelite n a encore ete enregistre.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
