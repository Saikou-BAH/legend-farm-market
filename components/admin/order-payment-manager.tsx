'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { recordAdminOrderPaymentTransaction } from '@/lib/actions/admin-order-payments'
import { getNetPaidAmount, getSuccessfulRefundTotal } from '@/lib/payment-transactions'
import {
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  getPaymentTransactionStatusLabel,
  getPaymentTransactionTypeLabel,
} from '@/lib/order-display'
import { formatDateTime, formatGNF } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { PaymentMethod, PaymentStatus, PaymentTransaction } from '@/types'

const paymentMethodOptions: PaymentMethod[] = [
  'orange_money',
  'mtn_money',
  'bank_transfer',
  'cash_on_delivery',
  'account_credit',
  'loyalty_points',
]

const transactionTypeOptions = [
  { value: 'charge', label: 'Encaissement' },
  { value: 'refund', label: 'Remboursement' },
] as const

const transactionStatusOptions = [
  { value: 'pending', label: 'En attente' },
  { value: 'succeeded', label: 'Reussi' },
  { value: 'failed', label: 'Echoue' },
  { value: 'cancelled', label: 'Annule' },
] as const

interface OrderPaymentManagerProps {
  orderId: string
  orderReference: string
  orderTotal: number
  paymentMethod: PaymentMethod | null
  paymentStatus: PaymentStatus
  paymentTransactions: PaymentTransaction[]
  orderStatusLabel: string
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

export function OrderPaymentManager({
  orderId,
  orderReference,
  orderTotal,
  paymentMethod,
  paymentStatus,
  paymentTransactions,
  orderStatusLabel,
}: OrderPaymentManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [amount, setAmount] = useState(orderTotal.toString())
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(
    paymentMethod ?? 'cash_on_delivery'
  )
  const [transactionType, setTransactionType] =
    useState<(typeof transactionTypeOptions)[number]['value']>('charge')
  const [transactionStatus, setTransactionStatus] =
    useState<(typeof transactionStatusOptions)[number]['value']>('succeeded')
  const [provider, setProvider] = useState('')
  const [providerReference, setProviderReference] = useState('')
  const [note, setNote] = useState('')

  const paymentSummary = useMemo(() => {
    const netPaidAmount = getNetPaidAmount(paymentTransactions)
    const refundedAmount = getSuccessfulRefundTotal(paymentTransactions)

    return {
      netPaidAmount,
      refundedAmount,
      remainingAmount: Math.max(orderTotal - netPaidAmount, 0),
    }
  }, [orderTotal, paymentTransactions])

  function resetForm() {
    setAmount(paymentSummary.remainingAmount > 0 ? paymentSummary.remainingAmount.toString() : orderTotal.toString())
    setProvider('')
    setProviderReference('')
    setNote('')
    setTransactionType('charge')
    setTransactionStatus('succeeded')
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    startTransition(async () => {
      const result = await recordAdminOrderPaymentTransaction({
        orderId,
        amount: Number(amount),
        paymentMethod: selectedMethod,
        transactionType,
        status: transactionStatus,
        provider: provider || null,
        providerReference: providerReference || null,
        note: note || null,
      })

      if (!result.success) {
        toast({
          title: 'Transaction non enregistree',
          description: result.error,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Transaction enregistree',
        description: `Le suivi de paiement de ${orderReference} a ete mis a jour.`,
      })
      resetForm()
      router.refresh()
    })
  }

  return (
    <Card className="xl:col-span-2">
      <CardHeader>
        <CardTitle>Paiement et transactions</CardTitle>
        <CardDescription>
          Historique transactionnel interne du paiement, independant d un provider externe.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-[1.25rem] border border-border/70 bg-muted/15 p-4 text-sm">
            <p className="text-muted-foreground">Statut paiement</p>
            <p className="mt-1 font-medium">{getPaymentStatusLabel(paymentStatus)}</p>
          </div>
          <div className="rounded-[1.25rem] border border-border/70 bg-muted/15 p-4 text-sm">
            <p className="text-muted-foreground">Montant commande</p>
            <p className="mt-1 font-medium">{formatGNF(orderTotal)}</p>
          </div>
          <div className="rounded-[1.25rem] border border-border/70 bg-muted/15 p-4 text-sm">
            <p className="text-muted-foreground">Net encaisse</p>
            <p className="mt-1 font-medium">{formatGNF(paymentSummary.netPaidAmount)}</p>
          </div>
          <div className="rounded-[1.25rem] border border-border/70 bg-muted/15 p-4 text-sm">
            <p className="text-muted-foreground">Reste theorique</p>
            <p className="mt-1 font-medium">{formatGNF(paymentSummary.remainingAmount)}</p>
          </div>
        </div>

        <div className="rounded-[1.25rem] border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Strategie de lancement actuelle</p>
          <p className="mt-2">
            Pour l instant, Legend Farm utilise un suivi transactionnel interne: les paiements
            sont traces ici, sans provider automatique branche. Le statut de paiement de la
            commande est recalcule depuis cet historique.
          </p>
          <p className="mt-2">
            Statut commande actuel: <span className="font-medium text-foreground">{orderStatusLabel}</span>.
            Evitez de saisir un encaissement reussi si la commande a deja ete annulee ou retournee.
          </p>
        </div>

        <form
          className="grid gap-4 rounded-[1.5rem] border border-border/70 bg-muted/20 p-5 md:grid-cols-2"
          onSubmit={handleSubmit}
        >
          <div className="space-y-2">
            <Label htmlFor="payment-transaction-type">Type</Label>
            <select
              id="payment-transaction-type"
              value={transactionType}
              onChange={(event) =>
                setTransactionType(event.target.value as (typeof transactionTypeOptions)[number]['value'])
              }
              disabled={isPending}
              className="flex h-12 w-full rounded-[1rem] border border-input bg-background px-4 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {transactionTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-transaction-status">Statut transactionnel</Label>
            <select
              id="payment-transaction-status"
              value={transactionStatus}
              onChange={(event) =>
                setTransactionStatus(
                  event.target.value as (typeof transactionStatusOptions)[number]['value']
                )
              }
              disabled={isPending}
              className="flex h-12 w-full rounded-[1rem] border border-input bg-background px-4 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {transactionStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-method">Mode de paiement</Label>
            <select
              id="payment-method"
              value={selectedMethod}
              onChange={(event) => setSelectedMethod(event.target.value as PaymentMethod)}
              disabled={isPending}
              className="flex h-12 w-full rounded-[1rem] border border-input bg-background px-4 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {paymentMethodOptions.map((method) => (
                <option key={method} value={method}>
                  {getPaymentMethodLabel(method)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-amount">Montant en GNF</Label>
            <Input
              id="payment-amount"
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              disabled={isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-provider">Provider ou canal</Label>
            <Input
              id="payment-provider"
              value={provider}
              onChange={(event) => setProvider(event.target.value)}
              disabled={isPending}
              placeholder="Orange Money, MTN, caisse, banque..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-provider-reference">Reference provider</Label>
            <Input
              id="payment-provider-reference"
              value={providerReference}
              onChange={(event) => setProviderReference(event.target.value)}
              disabled={isPending}
              placeholder="Reference de recu, transaction mobile money..."
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="payment-note">Note interne</Label>
            <textarea
              id="payment-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              disabled={isPending}
              placeholder="Contexte, justification, precision utile..."
              className="min-h-28 w-full rounded-[1rem] border border-input bg-background px-4 py-3 text-sm ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="md:col-span-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Enregistrement...' : 'Enregistrer la transaction'}
            </Button>
          </div>
        </form>

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
                      : 'Non traite'}
                  </p>
                  <p>Provider: {transaction.provider ?? 'Non renseigne'}</p>
                  <p>
                    Reference: {transaction.provider_reference ?? 'Non renseignee'}
                  </p>
                  <p>
                    Par: {transaction.created_by_staff_name ?? 'Systeme ou staff non resolu'}
                  </p>
                  <p>Devise: {transaction.currency_code}</p>
                </div>

                {transaction.note ? (
                  <p className="mt-3 text-muted-foreground">{transaction.note}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.25rem] border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
            Aucun mouvement de paiement n est encore enregistre pour cette commande.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
