import { renderEmailLayout, renderParagraph } from '@/lib/email-template'

interface AbandonedCartEmailProps {
  customerName: string
}

export function renderAbandonedCartEmail({
  customerName,
}: AbandonedCartEmailProps) {
  return renderEmailLayout({
    title: 'Votre panier vous attend',
    preview: 'Vos produits sont toujours disponibles en boutique.',
    bodyHtml: renderParagraph(
      `${customerName}, vos produits sont toujours disponibles en boutique.`
    ),
  })
}
