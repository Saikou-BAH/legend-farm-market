import type { PaymentTransaction } from '@/types'

export function getSuccessfulChargeTotal(transactions: PaymentTransaction[]) {
  return transactions
    .filter(
      (transaction) =>
        transaction.transaction_type === 'charge' && transaction.status === 'succeeded'
    )
    .reduce((total, transaction) => total + transaction.amount, 0)
}

export function getSuccessfulRefundTotal(transactions: PaymentTransaction[]) {
  return transactions
    .filter(
      (transaction) =>
        transaction.transaction_type === 'refund' && transaction.status === 'succeeded'
    )
    .reduce((total, transaction) => total + transaction.amount, 0)
}

export function getNetPaidAmount(transactions: PaymentTransaction[]) {
  return Math.max(
    getSuccessfulChargeTotal(transactions) - getSuccessfulRefundTotal(transactions),
    0
  )
}
