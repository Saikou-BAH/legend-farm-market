import { ContactForm } from '@/components/shop/contact-form'
import { WhatsAppButton } from '@/components/shop/whatsapp-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getPublicShopProfile } from '@/lib/actions/shop'

export const metadata = {
  title: 'Contact | Legend Farm Shop',
}

export default async function ContactPage() {
  const { shopAddress, shopEmail, shopName, shopPhone } = await getPublicShopProfile()

  return (
    <main className="pb-20">
      <section className="container pt-8 md:pt-12">
        <div className="surface-panel section-grid relative overflow-hidden rounded-[2.3rem] px-6 py-8 md:px-10 md:py-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(184,226,127,0.16),transparent_30%),radial-gradient(circle_at_86%_15%,rgba(138,194,255,0.12),transparent_22%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_0.85fr]">
            <section className="space-y-5">
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                  Contact
                </p>
                <h1 className="font-serif text-4xl md:text-5xl">Parler avec {shopName}</h1>
                <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                  Une question sur un produit, une livraison ou une commande speciale ?
                  Nous repondons avec un ton clair, utile et professionnel.
                </p>
              </div>

              <ContactForm />
            </section>

            <section className="space-y-5">
              <Card className="surface-panel border-white/80">
                <CardHeader>
                  <CardTitle>Coordonnees utiles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Adresse</p>
                    <p className="mt-1 font-medium">{shopAddress}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <a href={`mailto:${shopEmail}`} className="mt-1 block font-medium">
                      {shopEmail}
                    </a>
                  </div>
                  {shopPhone ? (
                    <div>
                      <p className="text-muted-foreground">Telephone</p>
                      <a href={`tel:${shopPhone}`} className="mt-1 block font-medium">
                        {shopPhone}
                      </a>
                    </div>
                  ) : null}

                  {shopPhone ? (
                    <div className="pt-2">
                      <WhatsAppButton
                        phone={shopPhone}
                        label="Ecrire sur WhatsApp"
                        message="Bonjour Legend Farm, j'aimerais avoir des informations."
                      />
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </section>
    </main>
  )
}
