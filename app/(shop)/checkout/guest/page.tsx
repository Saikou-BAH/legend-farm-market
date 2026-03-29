import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, LogIn } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { GuestCheckoutForm } from '@/components/shop/guest-checkout-form'
import { env } from '@/lib/env'

export const metadata: Metadata = {
  title: 'Commander sans compte',
  description: 'Passez votre commande Legend Farm sans créer de compte.',
}

export default function GuestCheckoutPage() {
  if (!env.hasSupabase() || !env.hasServiceRole()) {
    return (
      <main className="container py-10 md:py-12">
        <section className="surface-panel rounded-[2rem] px-6 py-8 md:px-8">
          <EmptyState
            title="Checkout indisponible"
            description="La configuration serveur est incomplète. Contactez Legend Farm."
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
            <Badge>Commande sans compte</Badge>
            <Badge variant="outline">Sans inscription</Badge>
          </div>
          <div className="space-y-3">
            <h1 className="font-serif text-4xl md:text-5xl">Commander sans compte</h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              Passez votre commande directement, sans créer de profil client. L&apos;équipe Legend Farm
              vous contactera pour confirmer la livraison ou le retrait.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href="/checkout">
                <LogIn className="h-4 w-4" />
                Commander avec un compte
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="gap-2">
              <Link href="/products">
                <ArrowLeft className="h-4 w-4" />
                Retour à la boutique
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <GuestCheckoutForm />
    </main>
  )
}
