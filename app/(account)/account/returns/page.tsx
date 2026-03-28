import { CustomerReturnsManager } from '@/components/account/customer-returns-manager'
import { EmptyState } from '@/components/ui/empty-state'
import { getCustomerReturnEligibleOrders, getCustomerReturns } from '@/lib/actions/returns'

export default async function AccountReturnsPage() {
  const [{ isAuthenticated, isConfigured, orders }, returnsState] = await Promise.all([
    getCustomerReturnEligibleOrders(),
    getCustomerReturns(),
  ])

  if (!isConfigured || !returnsState.isConfigured) {
    return (
      <EmptyState
        title="Supabase n est pas encore configure"
        description="Connectez la boutique a Supabase pour activer les retours clients."
      />
    )
  }

  if (!isAuthenticated || !returnsState.isAuthenticated) {
    return (
      <EmptyState
        title="Connexion client requise"
        description="Connectez-vous pour suivre vos retours et creer une nouvelle demande."
      />
    )
  }

  return (
    <CustomerReturnsManager orders={orders} returns={returnsState.returns} />
  )
}
