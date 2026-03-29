import type { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Informations légales',
  description:
    'Informations utiles, cadre de commande, contact et bonnes pratiques pour Legend Farm Shop.',
}

export default function LegalPage() {
  return (
    <main className="pb-20">
      <section className="container pt-8 md:pt-12">
        <div className="surface-panel section-grid relative overflow-hidden rounded-[2.3rem] px-6 py-8 md:px-10 md:py-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(184,226,127,0.16),transparent_30%),radial-gradient(circle_at_86%_15%,rgba(138,194,255,0.12),transparent_22%)]" />
          <div className="relative space-y-8">
            <section className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                Informations légales
              </p>
              <h1 className="max-w-4xl font-serif text-4xl md:text-5xl">
                Transparence, contact et cadre de commande
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
                Cette page regroupe les informations utiles sur Legend Farm Shop :
                contact, fonctionnement général, livraison, retours et usage raisonnable
                des services numériques du site.
              </p>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="surface-panel border-white/80">
                <CardHeader>
                  <CardTitle>Commande et disponibilité</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    Les prix et disponibilités affichés proviennent du back-office Legend
                    Farm Shop et peuvent être mis à jour en fonction de la production.
                  </p>
                  <p>
                    Une commande n'est considérée comme prise en charge qu'après création
                    effective dans le système, puis confirmation logistique si nécessaire.
                  </p>
                </CardContent>
              </Card>

              <Card className="surface-panel border-white/80">
                <CardHeader>
                  <CardTitle>Livraison et retrait</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    Les zones, frais et créneaux de livraison sont ceux configurés au moment
                    de votre commande.
                  </p>
                  <p>
                    Le retrait à la ferme peut être proposé selon la disponibilité et le type
                    de commande.
                  </p>
                </CardContent>
              </Card>

              <Card className="surface-panel border-white/80">
                <CardHeader>
                  <CardTitle>Retours et réclamations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    En cas de problème de qualité, de quantité ou d'erreur de préparation,
                    contactez rapidement la ferme avec votre référence de commande.
                  </p>
                  <p>
                    Le traitement dépendra du contexte : remboursement, avoir, échange ou
                    résolution logistique.
                  </p>
                </CardContent>
              </Card>

              <Card className="surface-panel border-white/80">
                <CardHeader>
                  <CardTitle>Contact et assistance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    Le site met à disposition un formulaire de contact, l'email de la ferme
                    et un accès WhatsApp quand le numéro est configuré.
                  </p>
                  <p>
                    Ces canaux doivent être utilisés pour les demandes commerciales,
                    logistiques ou de service après-vente raisonnables.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
