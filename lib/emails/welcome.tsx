import {
  renderActionButton,
  renderEmailLayout,
  renderParagraph,
} from '@/lib/email-template'

interface WelcomeEmailProps {
  customerName: string
  accountUrl: string
}

export function renderWelcomeEmail({ customerName, accountUrl }: WelcomeEmailProps) {
  return renderEmailLayout({
    title: 'Bienvenue sur Legend Farm Shop',
    preview: 'Votre compte client est pret.',
    bodyHtml: [
      renderParagraph(`Bonjour ${customerName}, votre compte client est pret.`),
      renderParagraph(
        'Vous pouvez maintenant retrouver vos adresses, votre panier, vos commandes et vos informations de livraison depuis votre espace client.'
      ),
      renderActionButton(accountUrl, 'Ouvrir mon compte'),
    ].join(''),
  })
}
