import Link from 'next/link'
import { ArrowRight, ShieldCheck, Sparkles, Truck } from 'lucide-react'
import { getPublicShopProfile } from '@/lib/actions/shop'
import { Button } from '@/components/ui/button'
import { WhatsAppButton } from '@/components/shop/whatsapp-button'

export async function SiteFooter() {
  const { shopAddress, shopEmail, shopName, shopPhone } = await getPublicShopProfile()

  return (
    <footer
      id="contact"
      className="mt-16 border-t border-[rgba(255,255,255,0.12)] bg-[linear-gradient(180deg,rgba(9,42,28,0.96),rgba(7,32,22,1))] text-white"
    >
      <div className="container space-y-10 py-12">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.08] p-8 text-white shadow-[0_26px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/70">
              {shopName}
            </p>
            <h2 className="mt-4 max-w-2xl font-serif text-3xl leading-tight md:text-4xl">
              Une boutique fermiere claire, premium et pilotable pour commander avec confiance.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72">
              Oeufs, poulets reformes et solutions agricoles presentes avec une
              image moderne, des prix lisibles en GNF et un parcours de commande
              simple.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/78">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2">
                <ShieldCheck className="h-4 w-4 text-[#b8e27f]" />
                Production suivie
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2">
                <Truck className="h-4 w-4 text-[#b8e27f]" />
                Livraison locale
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2">
                <Sparkles className="h-4 w-4 text-[#b8e27f]" />
                Image premium
              </span>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.08] p-8 text-white shadow-[0_26px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/70">
              Contact direct
            </p>
            <p className="mt-4 text-sm leading-7 text-white/72">
              Une question sur un produit, une livraison ou une commande speciale ? Notre equipe reste joignable rapidement.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Button asChild className="w-full justify-between">
                <Link href="/contact">
                  Ouvrir la page contact
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <WhatsAppButton
                phone={shopPhone}
                label="Contacter sur WhatsApp"
                message="Bonjour Legend Farm, j'aimerais avoir des informations."
                className="w-full justify-center"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-3 text-sm">
            <p className="font-semibold text-white">Marque</p>
            <p className="text-white/68">
              Ferme moderne, image propre, presentation premium et parcours de commande concu pour rassurer.
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-semibold text-white">Parcours</p>
            <Link href="/products" className="block text-white/68 transition-colors hover:text-white">
              Catalogue
            </Link>
            <Link href="/cart" className="block text-white/68 transition-colors hover:text-white">
              Panier
            </Link>
            <Link
              href="/account/dashboard"
              className="block text-white/68 transition-colors hover:text-white"
            >
              Mon compte
            </Link>
            <Link href="/delivery" className="block text-white/68 transition-colors hover:text-white">
              Livraison
            </Link>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-semibold text-white">Confiance</p>
            <Link href="/contact" className="block text-white/68 transition-colors hover:text-white">
              Contact
            </Link>
            <Link href="/legal" className="block text-white/68 transition-colors hover:text-white">
              Informations legales
            </Link>
            <p className="text-white/68">Prix affiches en GNF</p>
            <p className="text-white/68">Livraison locale et retrait ferme</p>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-semibold text-white">Coordonnees</p>
            <p className="text-white/68">{shopAddress}</p>
            <a
              href={`mailto:${shopEmail}`}
              className="block text-white/68 transition-colors hover:text-white"
            >
              {shopEmail}
            </a>
            {shopPhone ? (
              <a
                href={`tel:${shopPhone}`}
                className="block text-white/68 transition-colors hover:text-white"
              >
                {shopPhone}
              </a>
            ) : null}
          </div>
        </div>

        <div className="border-t border-white/10 pt-5 text-sm text-white/52">
          {shopName} · Boutique fermiere moderne, claire et premium.
        </div>
      </div>
    </footer>
  )
}
