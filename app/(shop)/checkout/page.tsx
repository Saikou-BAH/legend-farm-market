import Link from 'next/link'
import { CheckoutPageClient } from '@/components/shop/checkout-page-client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
      <main className="container py-10 md:py-12">
        <section className="surface-panel rounded-[2rem] px-6 py-8 md:px-8">
          <EmptyState
            title="Checkout indisponible"
            description="Ajoutez la configuration Supabase complète pour activer la création réelle de commande."
          />
        </section>
      </main>
    )
  }

  if (!isAuthenticated) {
    return (
      <main className="container py-10 md:py-12">
        <section className="surface-panel rounded-[2rem] px-6 py-8 md:px-8 space-y-6">
          <div className="space-y-3">
            <h1 className="font-serif text-3xl md:text-4xl">Finaliser ma commande</h1>
            <p className="text-muted-foreground max-w-lg">
              Connectez-vous pour profiter de vos avantages clients (fidélité, crédit, promotions),
              ou commandez directement sans compte.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/auth/login?next=/checkout">Se connecter</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/checkout/guest">Commander sans compte</Link>
            </Button>
          </div>
        </section>
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="container py-10 md:py-12">
        <section className="surface-panel rounded-[2rem] px-6 py-8 md:px-8">
          <EmptyState
            title="Profil client manquant"
            description="Le compte est connecté, mais aucun profil client exploitable n'est encore rattaché à cet utilisateur."
          />
        </section>
      </main>
    )
  }

  if (profile.is_blacklisted) {
    return (
      <main className="container py-10 md:py-12">
        <section className="surface-panel rounded-[2rem] px-6 py-8 md:px-8">
          <EmptyState
            title="Commande temporairement indisponible"
            description="Ce compte client ne peut pas créer de nouvelle commande pour le moment. Contactez l'équipe Legend Farm."
          />
        </section>
      </main>
    )
  }

  return (
    <main className="container space-y-8 py-10 md:py-12">
      <section className="surface-panel section-grid rounded-[2.2rem] px-6 py-8 md:px-10">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Commande sécurisée</Badge>
            <Badge variant="outline">Validation serveur</Badge>
          </div>
          <div className="space-y-3">
            <h1 className="font-serif text-4xl md:text-5xl">
              Finaliser ma commande
            </h1>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground">
              Vérifiez votre panier, choisissez votre mode de livraison et confirmez votre commande.
              Le stock, les prix et les frais de livraison sont revérifiés côté serveur au moment de la validation.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.3rem] border border-border/70 bg-white/72 p-4 text-sm">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Profil
            </p>
            <p className="mt-2 font-serif text-2xl">Client connecté</p>
          </div>
          <div className="rounded-[1.3rem] border border-border/70 bg-white/72 p-4 text-sm">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Livraison
            </p>
            <p className="mt-2 font-serif text-2xl">
              {deliveryZones.length > 0 ? `${deliveryZones.length} zone(s)` : 'Retrait ferme'}
            </p>
          </div>
          <div className="rounded-[1.3rem] border border-border/70 bg-white/72 p-4 text-sm">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Avantages
            </p>
            <p className="mt-2 font-serif text-2xl">{activePromotions.length} promo(s)</p>
          </div>
        </div>
      </section>

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
