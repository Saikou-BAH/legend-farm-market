import { CustomerProfileForm } from '@/components/account/customer-profile-form'
import { EmptyState } from '@/components/ui/empty-state'
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

  return <CustomerProfileForm profile={profile} />
}
