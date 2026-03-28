interface PromotionEmailProps {
  title: string
}

export function PromotionEmail({ title }: PromotionEmailProps) {
  return (
    <div>
      <h1>Nouvelle offre Legend Farm Shop</h1>
      <p>{title}</p>
    </div>
  )
}
