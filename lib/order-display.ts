import type {
  DeliveryType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PaymentTransactionStatus,
  PaymentTransactionType,
} from '@/types'

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: 'Commande recue',
  confirmed: 'Confirmee',
  preparing: 'En preparation',
  out_for_delivery: 'En livraison',
  delivered: 'Livree',
  cancelled: 'Annulee',
  returned: 'Retournee',
}

export const deliveryTypeLabels: Record<DeliveryType, string> = {
  delivery: 'Livraison',
  pickup: 'Retrait a la ferme',
}

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  orange_money: 'Orange Money',
  mtn_money: 'MTN Money',
  bank_transfer: 'Virement bancaire',
  cash_on_delivery: 'Paiement a la livraison',
  account_credit: 'Credit client',
  loyalty_points: 'Points fidelite',
}

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: 'En attente',
  partial: 'Paiement partiel',
  paid: 'Paye',
  refunded: 'Rembourse',
}

export const paymentTransactionTypeLabels: Record<PaymentTransactionType, string> = {
  charge: 'Encaissement',
  refund: 'Remboursement',
}

export const paymentTransactionStatusLabels: Record<PaymentTransactionStatus, string> = {
  pending: 'En attente',
  succeeded: 'Reussi',
  failed: 'Echoue',
  cancelled: 'Annule',
}

export function getOrderStatusLabel(status: OrderStatus) {
  return orderStatusLabels[status]
}

export function getDeliveryTypeLabel(deliveryType: DeliveryType) {
  return deliveryTypeLabels[deliveryType]
}

export function getPaymentMethodLabel(paymentMethod: PaymentMethod | null) {
  if (!paymentMethod) {
    return 'Non renseigne'
  }

  return paymentMethodLabels[paymentMethod]
}

export function getPaymentStatusLabel(paymentStatus: PaymentStatus) {
  return paymentStatusLabels[paymentStatus]
}

export function getPaymentTransactionTypeLabel(transactionType: PaymentTransactionType) {
  return paymentTransactionTypeLabels[transactionType]
}

export function getPaymentTransactionStatusLabel(
  transactionStatus: PaymentTransactionStatus
) {
  return paymentTransactionStatusLabels[transactionStatus]
}
