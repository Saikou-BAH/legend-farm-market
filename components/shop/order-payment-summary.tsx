import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getNetPaidAmount } from '@/lib/payment-transactions'
import {
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  getPaymentTransactionStatusLabel,
  getPaymentTransactionTypeLabel,
} from '@/lib/order-display'
import { formatDateTime, formatGNF } from '@/lib/utils'
import type { PaymentMethod, PaymentStatus, PaymentTransaction } from '@/types'

interface OrderPaymentSummaryProps {
  paymentMethod: PaymentMethod | null
  paymentStatus: PaymentStatus
  totalAmount: number
  paymentTransactions: PaymentTransaction[]
  title?: string
}

function getTransactionStatusVariant(status: PaymentTransaction['status']) {
  if (status === 'succeeded') {
    return 'default' as const
  }

  if (status === 'failed' || status === 'cancelled') {
    return 'outline' as const
  }

  return 'secondary' as const
}

export function OrderPaymentSummary({
  paymentMethod,
  paymentStatus,
  totalAmount,
  paymentTransactions,
  title = 'Paiement',
}: OrderPaymentSummaryProps) {
  const netPaidAmount = getNetPaidAmount(paymentTransactions)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 text-sm md:grid-cols-3">
          <div className="rounded-[1.25rem] border border-border/70 bg-muted/15 p-4">
            <p className="text-muted-foreground">Statut</p>
            <p className="mt-1 font-medium">{getPaymentStatusLabel(paymentStatus)}</p>
          </div>
          <div className="rounded-[1.25rem] border border-border/70 bg-muted/15 p-4">
            <p className="text-muted-foreground">Mode choisi</p>
            <p className="mt-1 font-medium">{getPaymentMethodLabel(paymentMethod)}</p>
          </div>
          <div className="rounded-[1.25rem] border border-border/70 bg-muted/15 p-4">
            <p className="text-muted-foreground">Net encaisse</p>
            <p className="mt-1 font-medium">
              {formatGNF(netPaidAmount)} / {formatGNF(totalAmount)}
            </p>
          </div>
        </div>

        <div className="rounded-[1.25rem] border border-border/70 bg-muted/15 p-4 text-sm text-muted-foreground">
          Le statut de paiement est mis a jour a partir des mouvements enregistres sur votre
          commande. Tant qu aucun encaissement reussi n est confirme, la commande peut rester en
          attente de paiement.
        </div>

        {paymentTransactions.length > 0 ? (
          <div className="space-y-3">
            {paymentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="rounded-[1.25rem] border border-border/70 p-4 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {getPaymentTransactionTypeLabel(transaction.transaction_type)}
                    </Badge>
                    <Badge variant={getTransactionStatusVariant(transaction.status)}>
                      {getPaymentTransactionStatusLabel(transaction.status)}
                    </Badge>
                    <span className="font-medium">{formatGNF(transaction.amount)}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {formatDateTime(transaction.created_at)}
                  </span>
                </div>

                <div className="mt-3 grid gap-2 text-muted-foreground md:grid-cols-2">
                  <p>Mode: {getPaymentMethodLabel(transaction.payment_method)}</p>
                  <p>
                    Traite le:{' '}
                    {transaction.processed_at
                      ? formatDateTime(transaction.processed_at)
                      : 'En attente'}
                  </p>
                </div>

                {transaction.note ? (
                  <p className="mt-3 text-muted-foreground">{transaction.note}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.25rem] border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
            Aucun mouvement de paiement detaille n est encore rattache a cette commande.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
