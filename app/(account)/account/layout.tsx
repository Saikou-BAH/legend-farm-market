import { CartProvider } from '@/hooks/use-cart'
import { AccountNav } from '@/components/layout/account-nav'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CartProvider>
      <div className="relative flex min-h-screen flex-col">
        <SiteHeader />
        <main className="container flex-1 space-y-8 py-12">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Espace client
            </p>
            <h1 className="font-serif text-4xl">Mon compte Legend Farm Shop</h1>
          </div>
          <AccountNav />
          {children}
        </main>
        <SiteFooter />
      </div>
    </CartProvider>
  )
}
