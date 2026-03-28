import { CartProvider } from '@/hooks/use-cart'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { FloatingWhatsAppButton } from '@/components/shop/floating-whatsapp-button'

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CartProvider>
      <div className="relative flex min-h-screen flex-col">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
        <FloatingWhatsAppButton />
      </div>
    </CartProvider>
  )
}
