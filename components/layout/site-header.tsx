import Link from 'next/link'
import { ArrowRight, ShieldCheck, Sprout, User } from 'lucide-react'
import { MobileNav } from '@/components/layout/mobile-nav'
import { WhatsAppButton } from '@/components/shop/whatsapp-button'
import { getPublicShopProfile } from '@/lib/actions/shop'
import { CartStatusButton } from '@/components/shop/cart-status-button'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/', label: 'Accueil' },
  { href: '/products', label: 'Boutique' },
  { href: '/delivery', label: 'Livraison' },
  { href: '/contact', label: 'Contact' },
  { href: '/account/dashboard', label: 'Mon compte' },
]

export async function SiteHeader() {
  const { shopPhone } = await getPublicShopProfile()

  return (
    <header className="sticky top-0 z-40 px-3 pt-3">
      <div className="container">
        <div className="surface-panel overflow-hidden rounded-[1.8rem] border-white/80">
          <div className="soft-divider border-b px-5 py-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  Œufs · Poulets · Fiente
                </span>
                <span className="hidden md:inline">Livraison à domicile · Retrait à la ferme</span>
              </div>
              {shopPhone ? (
                <a href={`tel:${shopPhone}`} className="transition-colors hover:text-foreground">
                  {shopPhone}
                </a>
              ) : (
                <span>Conakry, Guinée</span>
              )}
            </div>
          </div>

          <div className="flex h-20 items-center justify-between gap-4 px-5">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[1.15rem] bg-[linear-gradient(135deg,rgba(17,88,56,0.16),rgba(164,211,118,0.18))] text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                <Sprout className="h-5 w-5" />
              </div>
              <div>
                <p className="font-serif text-lg font-semibold leading-none">
                  Legend Farm
                </p>
                <p className="mt-1 text-[0.72rem] uppercase tracking-[0.18em] text-muted-foreground">
                  Produits de ferme locaux
                </p>
              </div>
            </Link>

            <nav className="hidden items-center gap-2 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full px-4 py-2 text-sm font-medium text-foreground/78 transition-all duration-200 hover:bg-white hover:text-foreground hover:shadow-[0_10px_22px_rgba(18,61,39,0.08)]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <MobileNav phone={shopPhone} />
              <div className="hidden xl:block">
                <WhatsAppButton
                  phone={shopPhone}
                  label="WhatsApp"
                  variant="ghost"
                  message="Bonjour Legend Farm, j'aimerais avoir des informations."
                />
              </div>
              <Button asChild variant="outline" size="icon">
                <Link href="/account/dashboard" aria-label="Mon compte">
                  <User className="h-4 w-4" />
                </Link>
              </Button>
              <CartStatusButton />
              <div className="hidden lg:block">
                <Button asChild size="sm">
                  <Link href="/products">
                    Commander
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
