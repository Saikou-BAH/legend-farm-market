import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCustomerAccount } from '@/lib/actions/customers'
import { formatGNF } from '@/lib/utils'

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

  const defaultAddress = addresses.find((address) => address.is_default) ?? null

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Points fidelite</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-serif text-3xl">{profile.loyalty_points}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Niveau {profile.loyalty_level}</Badge>
              <span className="text-sm text-muted-foreground">
                Cumulez vos achats pour progresser.
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Adresses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-serif text-3xl">{addresses.length}</p>
            <p className="text-sm text-muted-foreground">
              {defaultAddress?.full_address ??
                'Ajoutez une adresse de livraison pour faciliter le checkout.'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Credit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-serif text-3xl">{formatGNF(profile.credit_balance)}</p>
            <p className="text-sm text-muted-foreground">
              Limite actuelle : {formatGNF(profile.credit_limit)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Raccourcis utiles</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/account/orders">Voir mes commandes</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/account/addresses">Gerer mes adresses</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/account/profile">Mettre a jour mon profil</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
