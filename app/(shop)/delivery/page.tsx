import type { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Package, Truck } from 'lucide-react'
import { WhatsAppButton } from '@/components/shop/whatsapp-button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getPublicDeliveryZonesList } from '@/lib/actions/delivery'
import { getPublicShopProfile } from '@/lib/actions/shop'
import { formatGNF } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Livraison',
  description:
    'Livraison a domicile ou retrait a la ferme. Zones desservies, frais et delais de livraison Legend Farm.',
}

export default async function DeliveryPage() {
  const [{ isConfigured, zones }, shopProfile] = await Promise.all([
    getPublicDeliveryZonesList(),
    getPublicShopProfile(),
  ])

  return (
    <main className="pb-20">
      <section className="container pt-8 md:pt-12">
        <div className="surface-panel section-grid relative overflow-hidden rounded-[2.3rem] px-6 py-8 md:px-10 md:py-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(184,226,127,0.16),transparent_30%),radial-gradient(circle_at_86%_15%,rgba(138,194,255,0.12),transparent_22%)]" />

          <div className="relative space-y-8">
            <div className="space-y-4">
              <Badge variant="secondary">Livraison</Badge>
              <h1 className="max-w-2xl font-serif text-4xl md:text-5xl">
                Livraison a domicile ou retrait a la ferme
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                Nous livrons a domicile dans plusieurs zones. Vous pouvez
                aussi retirer votre commande directement a la ferme, gratuitement,
                selon votre disponibilite.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-white/72 px-4 py-4 text-sm">
                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">Livraison a domicile</p>
                  <p className="mt-1 text-muted-foreground">Livraison · frais selon la zone</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-white/72 px-4 py-4 text-sm">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">Retrait a la ferme</p>
                  <p className="mt-1 text-muted-foreground">Gratuit · sur rendez-vous</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-white/72 px-4 py-4 text-sm">
                <Package className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">Commande confirmee</p>
                  <p className="mt-1 text-muted-foreground">24 a 48h apres validation</p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <Card className="surface-panel border-white/80">
                <CardHeader>
                  <CardTitle>Zones de livraison</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isConfigured && zones.length > 0 ? (
                    zones.map((zone) => (
                      <div
                        key={zone.id}
                        className="rounded-2xl border border-border/70 bg-white/72 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{zone.name}</p>
                            <p className="mt-0.5 text-sm text-muted-foreground">{zone.city}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatGNF(zone.delivery_fee)}</p>
                            <p className="text-xs text-muted-foreground">frais de livraison</p>
                          </div>
                        </div>
                        <div className="mt-3 grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
                          {zone.min_order_amount > 0 ? (
                            <p>Commande minimum : {formatGNF(zone.min_order_amount)}</p>
                          ) : null}
                          <p>
                            Delai : {zone.estimated_delay ?? 'A confirmer avec la ferme'}
                          </p>
                          {zone.available_slots && zone.available_slots.length > 0 ? (
                            <p>Creneaux : {zone.available_slots.join(', ')}</p>
                          ) : null}
                          {zone.available_days && zone.available_days.length > 0 ? (
                            <p>Jours : {zone.available_days.join(', ')}</p>
                          ) : null}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center">
                      <p className="font-serif text-xl">Zones bientot disponibles</p>
                      <p className="mt-3 text-sm leading-7 text-muted-foreground">
                        Les zones de livraison seront configurees prochainement. Pour
                        organiser une livraison ou un retrait des maintenant, contactez-nous
                        directement.
                      </p>
                      <div className="mt-5 flex flex-wrap justify-center gap-3">
                        <WhatsAppButton
                          phone={shopProfile.shopPhone}
                          label="Contacter sur WhatsApp"
                          message="Bonjour Legend Farm, je voudrais organiser une livraison."
                        />
                        <Link
                          href="/contact"
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          Voir la page contact
                        </Link>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-5">
                <Card className="surface-panel border-white/80">
                  <CardHeader>
                    <CardTitle>Comment ca se passe</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>1. Vous ajoutez vos produits au panier et validez la commande.</p>
                    <p>2. Vous choisissez livraison a domicile ou retrait a la ferme.</p>
                    <p>3. Nous confirmons la preparation et vous informons du suivi.</p>
                    <p>4. Les statuts sont disponibles dans votre espace client.</p>
                  </CardContent>
                </Card>

                <Card className="surface-panel border-white/80">
                  <CardHeader>
                    <CardTitle>Une question sur la livraison ?</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-muted-foreground">
                    <p>
                      Contrainte logistique, commande en grande quantite ou besoin
                      d un creneau particulier ? Contactez-nous avant de valider.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <WhatsAppButton
                        phone={shopProfile.shopPhone}
                        label="WhatsApp"
                        message="Bonjour Legend Farm, j ai une question sur la livraison."
                        size="sm"
                      />
                      <Link
                        href="/contact"
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Formulaire de contact
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
