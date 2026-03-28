import Link from 'next/link'
import { Egg, MapPin, ShieldCheck, Truck } from 'lucide-react'
import { getPublicShopProfile } from '@/lib/actions/shop'
import { WhatsAppButton } from '@/components/shop/whatsapp-button'

export async function SiteFooter() {
  const { shopAddress, shopEmail, shopName, shopPhone } = await getPublicShopProfile()

  return (
    <footer className="mt-16 border-t border-[rgba(255,255,255,0.12)] bg-[linear-gradient(180deg,rgba(9,42,28,0.96),rgba(7,32,22,1))] text-white">
      <div className="container space-y-10 py-12">

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[0.9rem] bg-white/12">
                <Egg className="h-4 w-4" />
              </div>
              <p className="font-serif text-xl font-semibold">{shopName}</p>
            </div>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/68">
              Oeufs frais, poulets reformes et fiente directement depuis la ferme.
              Commandez en ligne ou par WhatsApp, livraison a Conakry ou retrait a
              la ferme.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs text-white/70">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-[#b8e27f]" />
                Production locale
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5">
                <Truck className="h-3.5 w-3.5 text-[#b8e27f]" />
                Livraison a Conakry
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5">
                <MapPin className="h-3.5 w-3.5 text-[#b8e27f]" />
                Retrait a la ferme
              </span>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-8">
            <p className="text-sm font-semibold text-white/70">Commander rapidement</p>
            <p className="mt-3 text-sm leading-7 text-white/68">
              Le plus simple : envoyez-nous un message WhatsApp avec votre
              commande. On confirme et on organise le reste.
            </p>
            <div className="mt-5">
              <WhatsAppButton
                phone={shopPhone}
                label="Ecrire sur WhatsApp"
                message="Bonjour Legend Farm, je voudrais passer une commande."
                className="w-full justify-center"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3 xl:grid-cols-4">
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-white">Boutique</p>
            <Link href="/products" className="block text-white/68 transition-colors hover:text-white">
              Catalogue
            </Link>
            <Link href="/cart" className="block text-white/68 transition-colors hover:text-white">
              Panier
            </Link>
            <Link href="/delivery" className="block text-white/68 transition-colors hover:text-white">
              Livraison
            </Link>
            <Link href="/account/dashboard" className="block text-white/68 transition-colors hover:text-white">
              Mon compte
            </Link>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-semibold text-white">Informations</p>
            <Link href="/contact" className="block text-white/68 transition-colors hover:text-white">
              Contact
            </Link>
            <Link href="/legal" className="block text-white/68 transition-colors hover:text-white">
              Mentions legales
            </Link>
            <p className="text-white/68">Prix en GNF</p>
          </div>

          <div className="space-y-2 text-sm md:col-span-1 xl:col-span-2">
            <p className="font-semibold text-white">Coordonnees</p>
            <p className="text-white/68">{shopAddress}</p>
            <a href={`mailto:${shopEmail}`} className="block text-white/68 transition-colors hover:text-white">
              {shopEmail}
            </a>
            {shopPhone ? (
              <a href={`tel:${shopPhone}`} className="block text-white/68 transition-colors hover:text-white">
                {shopPhone}
              </a>
            ) : null}
          </div>
        </div>

        <div className="border-t border-white/10 pt-5 text-sm text-white/44">
          {shopName} · Produits de ferme locaux · Conakry, Guinee
        </div>
      </div>
    </footer>
  )
}
