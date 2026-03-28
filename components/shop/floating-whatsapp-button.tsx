import { getPublicShopProfile } from '@/lib/actions/shop'
import { getWhatsAppHref } from '@/lib/contact'
import { WhatsAppIcon } from '@/components/shop/whatsapp-button'

export async function FloatingWhatsAppButton() {
  const { shopPhone } = await getPublicShopProfile()
  const href = getWhatsAppHref(
    shopPhone,
    'Bonjour Legend Farm, je voudrais passer une commande.'
  )

  if (!href) return null

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Commander sur WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_28px_rgba(37,211,102,0.45)] transition-all duration-200 hover:scale-110 hover:shadow-[0_12px_36px_rgba(37,211,102,0.55)] md:h-16 md:w-16"
    >
      <WhatsAppIcon className="h-7 w-7 md:h-8 md:w-8" />
    </a>
  )
}
