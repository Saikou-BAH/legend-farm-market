import type { Metadata } from 'next'
import { ContactForm } from '@/components/shop/contact-form'
import { WhatsAppButton } from '@/components/shop/whatsapp-button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getPublicShopProfile } from '@/lib/actions/shop'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Contactez Legend Farm pour une question sur un produit, une commande ou une livraison. Formulaire en ligne ou WhatsApp.',
}

export default async function ContactPage() {
  const { shopAddress, shopEmail, shopName, shopPhone } = await getPublicShopProfile()

  return (
    <main className="pb-20">
      <section className="container pt-8 md:pt-12">
        <div className="surface-panel section-grid relative overflow-hidden rounded-[2.3rem] px-6 py-8 md:px-10 md:py-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(184,226,127,0.16),transparent_30%),radial-gradient(circle_at_86%_15%,rgba(138,194,255,0.12),transparent_22%)]" />

          <div className="relative grid gap-10 lg:grid-cols-[1fr_0.8fr]">
            <div className="space-y-6">
              <div className="space-y-4">
                <Badge variant="secondary">Contact</Badge>
                <h1 className="font-serif text-4xl md:text-5xl">
                  On est disponibles pour vous repondre.
                </h1>
                <p className="max-w-xl text-lg leading-8 text-muted-foreground">
                  Une question sur un produit, sa disponibilite, une livraison ou
                  une commande speciale ? Remplissez le formulaire ou ecrivez-nous
                  directement sur WhatsApp.
                </p>
              </div>

              <ContactForm />
            </div>

            <div className="space-y-5">
              {shopPhone ? (
                <Card className="surface-panel border-white/80">
                  <CardHeader>
                    <CardTitle>La facon la plus rapide</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <p className="leading-7 text-muted-foreground">
                      Pour une reponse rapide, ecrivez-nous sur WhatsApp. Nous
                      repondons generalement dans la journee.
                    </p>
                    <WhatsAppButton
                      phone={shopPhone}
                      label="Ecrire sur WhatsApp"
                      message="Bonjour Legend Farm, j aimerais avoir des informations."
                      className="w-full justify-center"
                    />
                  </CardContent>
                </Card>
              ) : null}

              <Card className="surface-panel border-white/80">
                <CardHeader>
                  <CardTitle>Coordonnees</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">Ferme</p>
                    <p className="mt-1">{shopName}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Adresse</p>
                    <p className="mt-1">{shopAddress}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Email</p>
                    <a
                      href={`mailto:${shopEmail}`}
                      className="mt-1 block text-primary hover:underline"
                    >
                      {shopEmail}
                    </a>
                  </div>
                  {shopPhone ? (
                    <div>
                      <p className="font-medium text-muted-foreground">Telephone</p>
                      <a
                        href={`tel:${shopPhone}`}
                        className="mt-1 block text-primary hover:underline"
                      >
                        {shopPhone}
                      </a>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
