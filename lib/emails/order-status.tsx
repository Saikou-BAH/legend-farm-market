interface OrderStatusEmailProps {
  reference: string
  status: string
}

export function OrderStatusEmail({ reference, status }: OrderStatusEmailProps) {
  return (
    <div>
      <h1>Mise a jour de commande</h1>
      <p>
        La commande {reference} est maintenant au statut {status}.
      </p>
    </div>
  )
}
