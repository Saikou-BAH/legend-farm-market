interface AbandonedCartEmailProps {
  customerName: string
}

export function AbandonedCartEmail({
  customerName,
}: AbandonedCartEmailProps) {
  return (
    <div>
      <h1>Votre panier vous attend</h1>
      <p>{customerName}, vos produits sont toujours disponibles en boutique.</p>
    </div>
  )
}
