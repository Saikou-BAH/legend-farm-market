import { CheckoutPageClient } from '@/components/shop/checkout-page-client'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { getCheckoutPageData } from '@/lib/actions/shop'

export default async function CheckoutPage() {
  const {
    activePromotions,
    addresses,
    deliveryZones,
    isAuthenticated,
    isConfigured,
    loyaltyPointsRate,
    loyaltyPointValue,
    minOrderAmount,
    profile,
  } = await getCheckoutPageData()

  if (!isConfigured) {
    return (
      <main className="container py-12">
        <EmptyState
          title="Checkout indisponible"
          description="Ajoutez la configuration Supabase complete pour activer la creation reelle de commande."
        />
      </main>
    )
  }

  if (!isAuthenticated) {
    return (
      <main className="container py-12">
        <EmptyState
          title="Connexion requise"
          description="Connectez-vous avec un compte client pour acceder au checkout."
        />
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="container py-12">
        <EmptyState
          title="Profil client manquant"
          description="Le compte est connecte, mais aucun profil client exploitable n est encore rattache a cet utilisateur."
        />
      </main>
    )
  }

  if (profile.is_blacklisted) {
    return (
      <main className="container py-12">
        <EmptyState
          title="Commande temporairement indisponible"
          description="Ce compte client ne peut pas creer de nouvelle commande pour le moment. Contactez l equipe Legend Farm."
        />
      </main>
    )
  }

  return (
    <main className="container space-y-8 py-12">
      <div className="space-y-3">
        <Badge>Commande securisee</Badge>
        <h1 className="font-serif text-4xl">Finaliser ma commande</h1>
        <p className="max-w-3xl text-muted-foreground">
          Verifiez votre panier, choisissez votre mode de retrait et confirmez votre commande.
          Le stock, les prix et les frais de livraison sont reverifies cote serveur au moment
          de la validation.
        </p>
      </div>

      <CheckoutPageClient
        activePromotions={activePromotions}
        profile={profile}
        addresses={addresses}
        deliveryZones={deliveryZones}
        loyaltyPointValue={loyaltyPointValue}
        loyaltyPointsRate={loyaltyPointsRate}
        minOrderAmount={minOrderAmount}
      />
    </main>
  )
}
