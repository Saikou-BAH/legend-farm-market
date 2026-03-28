import { LoyaltyBadge } from '@/components/shop/loyalty-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCustomerLoyaltySnapshot } from '@/lib/actions/loyalty'

export default async function AccountLoyaltyPage() {
  const { isAuthenticated, isConfigured, profile } = await getCustomerLoyaltySnapshot()

  if (!isConfigured || !isAuthenticated || !profile) {
    return (
      <EmptyState
        title="Programme fidelite indisponible"
        description="Connectez-vous avec un profil client actif pour suivre vos points et votre niveau."
      />
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fidelite</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <LoyaltyBadge level={profile.loyalty_level} />
        <p className="font-serif text-4xl">{profile.loyalty_points}</p>
        <p className="text-sm text-muted-foreground">
          Vos points et votre niveau seront automatiquement recalcules depuis Supabase.
        </p>
      </CardContent>
    </Card>
  )
}
