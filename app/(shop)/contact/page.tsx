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
    <main className="container grid gap-8 py-12 lg:grid-cols-[1fr_0.85fr]">
      <section className="space-y-5">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Contact
          </p>
          <h1 className="font-serif text-4xl">Parler avec {shopName}</h1>
          <p className="max-w-2xl text-muted-foreground">
            Une question sur un produit, une livraison ou une commande speciale ?
            Nous vous repondons par email, telephone ou WhatsApp selon le canal le
            plus simple.
          </p>
        </div>

        <ContactForm />
      </section>

      <section className="space-y-5">
        <Card>
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
    </main>
  )
}
