import { CustomerAddressesManager } from '@/components/account/customer-addresses-manager'
import { EmptyState } from '@/components/ui/empty-state'
import { getCustomerAccount } from '@/lib/actions/customers'

export default async function AccountAddressesPage() {
  const { addresses, isAuthenticated, isConfigured } = await getCustomerAccount()

  if (!isConfigured || !isAuthenticated) {
    return (
      <EmptyState
        title="Adresses indisponibles"
        description="Connectez-vous avec un compte client pour gerer les adresses de livraison."
      />
    )
  }

  return <CustomerAddressesManager addresses={addresses} />
}
