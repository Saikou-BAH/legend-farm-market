import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCustomerAccount } from '@/lib/actions/customers'

export default async function AccountProfilePage() {
  const { isAuthenticated, isConfigured, profile } = await getCustomerAccount()

  if (!isConfigured || !isAuthenticated || !profile) {
    return (
      <EmptyState
        title="Profil indisponible"
        description="Connectez-vous avec un compte client pour consulter et modifier votre profil."
      />
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil client</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Nom</span>
          <span>{profile.full_name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Email</span>
          <span>{profile.email}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Telephone</span>
          <span>{profile.phone ?? 'Non renseigne'}</span>
        </div>
      </CardContent>
    </Card>
  )
}
