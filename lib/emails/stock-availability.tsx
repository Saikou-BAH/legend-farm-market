import {
  renderActionButton,
  renderEmailLayout,
  renderParagraph,
  renderRichParagraph,
} from '@/lib/email-template'

interface StockAvailabilityEmailProps {
  customerName: string | null
  productName: string
  productUrl: string
}

export function renderStockAvailabilityEmail({
  customerName,
  productName,
  productUrl,
}: StockAvailabilityEmailProps) {
  return renderEmailLayout({
    title: `${productName} est de retour`,
    preview: `${productName} est a nouveau disponible sur la boutique.`,
    bodyHtml: [
      renderParagraph(`Bonjour ${customerName?.trim() || 'depuis Legend Farm Shop'},`),
      renderRichParagraph(
        `Le produit <strong>${productName}</strong> est a nouveau disponible sur la boutique.`
      ),
      renderActionButton(productUrl, 'Voir le produit'),
      renderParagraph('A bientot sur Legend Farm Shop.'),
    ].join(''),
  })
}
