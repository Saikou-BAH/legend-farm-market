import {
  renderActionButton,
  renderEmailLayout,
  renderParagraph,
  renderRichParagraph,
} from '@/lib/email-template'

interface OrderConfirmationEmailProps {
  customerName: string | null
  reference: string
  orderUrl: string
  totalAmountLabel: string
}

export function renderOrderConfirmationEmail({
  customerName,
  reference,
  orderUrl,
  totalAmountLabel,
}: OrderConfirmationEmailProps) {
  return renderEmailLayout({
    title: 'Commande confirmee',
    preview: `Votre commande ${reference} a bien ete enregistree.`,
    bodyHtml: [
      renderParagraph(`Bonjour ${customerName?.trim() || 'depuis Legend Farm Shop'},`),
      renderRichParagraph(
        `Votre commande <strong>${reference}</strong> a bien ete enregistree pour un montant total de <strong>${totalAmountLabel}</strong>.`
      ),
      renderParagraph(
        'Vous pouvez suivre son avancement depuis votre espace commande.'
      ),
      renderActionButton(orderUrl, 'Suivre ma commande'),
      renderParagraph(
        'Merci pour votre confiance. Nous reviendrons vers vous si une precision logistique est necessaire.'
      ),
    ].join(''),
  })
}
