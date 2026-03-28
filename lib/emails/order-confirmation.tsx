interface OrderConfirmationEmailProps {
  reference: string
}

export function OrderConfirmationEmail({
  reference,
}: OrderConfirmationEmailProps) {
  return (
    <div>
      <h1>Commande confirmee</h1>
      <p>Votre commande {reference} a bien ete enregistree.</p>
    </div>
  )
}
