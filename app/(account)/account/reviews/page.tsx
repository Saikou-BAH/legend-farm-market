import { CustomerReviewsManager } from '@/components/account/customer-reviews-manager'
import { EmptyState } from '@/components/ui/empty-state'
import { getCustomerReviews } from '@/lib/actions/reviews'

export default async function AccountReviewsPage() {
  const { eligibleItems, isAuthenticated, isConfigured, reviews } =
    await getCustomerReviews()

  if (!isConfigured) {
    return (
      <EmptyState
        title="Supabase n est pas encore configure"
        description="Connectez la boutique a Supabase pour activer les avis produits."
      />
    )
  }

  if (!isAuthenticated) {
    return (
      <EmptyState
        title="Connexion client requise"
        description="Connectez-vous pour laisser un avis et suivre vos publications."
      />
    )
  }

  return <CustomerReviewsManager eligibleItems={eligibleItems} reviews={reviews} />
}
