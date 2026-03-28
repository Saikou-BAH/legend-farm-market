import {
  renderActionButton,
  renderEmailLayout,
  renderParagraph,
  renderRichParagraph,
} from '@/lib/email-template'

interface OrderStatusEmailProps {
  customerName: string | null
  reference: string
  statusLabel: string
  orderUrl: string
}

export function renderOrderStatusEmail({
  customerName,
  reference,
  statusLabel,
  orderUrl,
}: OrderStatusEmailProps) {
  return renderEmailLayout({
    title: 'Mise a jour de commande',
    preview: `La commande ${reference} est maintenant au statut ${statusLabel}.`,
    bodyHtml: [
      renderParagraph(`Bonjour ${customerName?.trim() || 'depuis Legend Farm Shop'},`),
      renderRichParagraph(
        `La commande <strong>${reference}</strong> est maintenant au statut <strong>${statusLabel}</strong>.`
      ),
      renderActionButton(orderUrl, 'Suivre ma commande'),
    ].join(''),
  })
}
