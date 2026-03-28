import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCustomerAccount } from '@/lib/actions/customers'
import { formatCurrency } from '@/lib/utils'

export default async function AccountDashboardPage() {
  const { addresses, isAuthenticated, isConfigured, profile } = await getCustomerAccount()

  if (!isConfigured) {
    return (
      <EmptyState
        title="Supabase n est pas encore configure"
        description="Ajoutez les variables d environnement puis reconnectez-vous pour charger le vrai profil client."
      />
    )
  }

  if (!isAuthenticated) {
    return (
      <EmptyState
        title="Connexion requise"
        description="Connectez-vous pour consulter vos points, vos adresses et votre credit client."
      />
    )
  }

  if (!profile) {
    return (
      <EmptyState
        title="Profil client a completer"
        description="Le compte est authentifie, mais aucun `customer_profile` n est encore rattache a cet utilisateur."
      />
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Points fidelite</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="font-serif text-3xl">{profile.loyalty_points}</p>
          <p className="text-sm text-muted-foreground">Niveau actuel : {profile.loyalty_level}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Adresses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="font-serif text-3xl">{addresses.length}</p>
          <p className="text-sm text-muted-foreground">
            {addresses[0]?.full_address ??
              'Ajoutez une adresse de livraison pour faciliter le checkout.'}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Credit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="font-serif text-3xl">{formatCurrency(profile.credit_balance)}</p>
          <p className="text-sm text-muted-foreground">
            Limite actuelle : {formatCurrency(profile.credit_limit)}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
