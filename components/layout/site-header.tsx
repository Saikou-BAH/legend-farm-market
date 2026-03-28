import Link from 'next/link'
import { Sprout, User } from 'lucide-react'
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
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sprout className="h-5 w-5" />
          </div>
          <div>
            <p className="font-serif text-lg font-semibold leading-none">
              Legend Farm Shop
            </p>
            <p className="text-xs text-muted-foreground">Produits fermiers premium</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <MobileNav phone={shopPhone} />
          <div className="hidden lg:block">
            <WhatsAppButton
              phone={shopPhone}
              label="WhatsApp"
              variant="ghost"
              message="Bonjour Legend Farm, j'aimerais avoir des informations."
            />
          </div>
          <Button asChild variant="ghost" size="icon">
            <Link href="/account/dashboard" aria-label="Mon compte">
              <User className="h-4 w-4" />
            </Link>
          </Button>
          <CartStatusButton />
        </div>
      </div>
    </header>
  )
}
