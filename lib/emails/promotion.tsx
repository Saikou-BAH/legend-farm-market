import { renderEmailLayout, renderParagraph } from '@/lib/email-template'

interface PromotionEmailProps {
  title: string
}

export function renderPromotionEmail({ title }: PromotionEmailProps) {
  return renderEmailLayout({
    title: 'Nouvelle offre Legend Farm Shop',
    preview: title,
    bodyHtml: renderParagraph(title),
  })
}
