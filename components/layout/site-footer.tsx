import Link from 'next/link'
import { getPublicShopProfile } from '@/lib/actions/shop'
import { WhatsAppButton } from '@/components/shop/whatsapp-button'

export async function SiteFooter() {
  const { shopAddress, shopEmail, shopName, shopPhone } = await getPublicShopProfile()

  return (
    <footer id="contact" className="border-t border-border/60 bg-card/80">
      <div className="container grid gap-6 py-10 md:grid-cols-3">
        <div className="space-y-3">
          <p className="font-serif text-xl font-semibold">{shopName}</p>
          <p className="text-sm text-muted-foreground">
            Oeufs, volailles et produits fermiers, avec une experience e-commerce
            pensee pour la vente directe et la livraison en Guinee.
          </p>
        </div>

        <div className="space-y-2 text-sm">
          <p className="font-semibold">Parcours</p>
          <Link
            href="/products"
            className="block text-muted-foreground hover:text-foreground"
          >
            Catalogue
          </Link>
          <Link href="/cart" className="block text-muted-foreground hover:text-foreground">
            Panier
          </Link>
          <Link
            href="/account/dashboard"
            className="block text-muted-foreground hover:text-foreground"
          >
            Mon compte
          </Link>
          <Link href="/contact" className="block text-muted-foreground hover:text-foreground">
            Contact
          </Link>
          <Link href="/delivery" className="block text-muted-foreground hover:text-foreground">
            Livraison
          </Link>
          <Link href="/legal" className="block text-muted-foreground hover:text-foreground">
            Informations legales
          </Link>
        </div>

        <div className="space-y-2 text-sm">
          <p className="font-semibold">Exploitation</p>
          <p className="text-muted-foreground">{shopAddress}</p>
          <a
            href={`mailto:${shopEmail}`}
            className="block text-muted-foreground transition-colors hover:text-foreground"
          >
            {shopEmail}
          </a>
          {shopPhone ? (
            <a
              href={`tel:${shopPhone}`}
              className="block text-muted-foreground transition-colors hover:text-foreground"
            >
              {shopPhone}
            </a>
          ) : null}
          <p className="text-muted-foreground">Livraison locale et retrait ferme</p>
          <WhatsAppButton
            phone={shopPhone}
            label="Contacter sur WhatsApp"
            variant="ghost"
            message="Bonjour Legend Farm, j'aimerais avoir des informations."
            className="px-0"
          />
        </div>
      </div>
    </footer>
  )
}
