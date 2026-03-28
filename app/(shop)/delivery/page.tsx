import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getPublicDeliveryZonesList } from '@/lib/actions/delivery'
import { formatGNF } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Livraison',
  description:
    'Informations de livraison, zones desservies, frais et organisation des commandes Legend Farm Shop.',
}

export default async function DeliveryPage() {
  const { isConfigured, zones } = await getPublicDeliveryZonesList()

  return (
    <main className="pb-20">
      <section className="container pt-8 md:pt-12">
        <div className="surface-panel section-grid relative overflow-hidden rounded-[2.3rem] px-6 py-8 md:px-10 md:py-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(184,226,127,0.16),transparent_30%),radial-gradient(circle_at_86%_15%,rgba(138,194,255,0.12),transparent_22%)]" />
          <div className="relative space-y-8">
            <section className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                Livraison
              </p>
              <h1 className="max-w-4xl font-serif text-4xl md:text-5xl">
                Commander en confiance, etre livre clairement
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
                Legend Farm Shop affiche ses zones de livraison, ses frais et ses
                creneaux de maniere plus lisible pour eviter les surprises au moment
                de la commande.
              </p>
            </section>

            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <Card className="surface-panel border-white/80">
                <CardHeader>
                  <CardTitle>Zones et frais actuellement configures</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isConfigured && zones.length > 0 ? (
                    zones.map((zone) => (
                      <div
                        key={zone.id}
                        className="rounded-2xl border border-border/70 bg-white/72 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-medium">{zone.name}</p>
                            <p className="text-sm text-muted-foreground">{zone.city}</p>
                          </div>
                          <p className="font-semibold">{formatGNF(zone.delivery_fee)}</p>
                        </div>
                        <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                          <p>Minimum conseille: {formatGNF(zone.min_order_amount)}</p>
                          <p>
                            Delai estime: {zone.estimated_delay ?? 'A confirmer avec la ferme'}
                          </p>
                          <p>
                            Creneaux: {zone.available_slots?.join(', ') || 'Selon disponibilite'}
                          </p>
                          <p>
                            Jours: {zone.available_days?.join(', ') || 'Selon organisation'}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Les zones de livraison seront confirmees depuis le back-office si la
                      configuration n est pas encore complete.
                    </p>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="surface-panel border-white/80">
                  <CardHeader>
                    <CardTitle>Comment nous organisons la commande</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>1. Vous ajoutez vos produits au panier.</p>
                    <p>2. Vous choisissez livraison ou retrait a la ferme.</p>
                    <p>3. L equipe confirme la preparation et le suivi de commande.</p>
                    <p>4. Les statuts evoluent ensuite dans votre espace client.</p>
                  </CardContent>
                </Card>

                <Card className="surface-panel border-white/80">
                  <CardHeader>
                    <CardTitle>Besoin d aide avant de commander ?</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>
                      Si vous avez une contrainte logistique ou une commande speciale, le plus
                      simple est de nous contacter avant validation.
                    </p>
                    <Link href="/contact" className="font-medium text-primary hover:text-primary/80">
                      Contacter Legend Farm
                    </Link>
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
