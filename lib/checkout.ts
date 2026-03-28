import type {
  CustomerAddress,
  DeliveryType,
  DeliveryZone,
  PaymentMethod,
  Promotion,
} from '@/types'

export interface CheckoutItemInput {
  productId: string
  quantity: number
}

export interface CreateCheckoutOrderInput {
  items: CheckoutItemInput[]
  deliveryType: DeliveryType
  deliveryAddressId: string | null
  deliveryZoneId: string | null
  deliverySlot: string | null
  deliveryDate: string | null
  deliveryInstructions: string | null
  customerNotes: string | null
  paymentMethod: PaymentMethod
  promoCode: string | null
  pointsToRedeem: number | null
  useAccountCredit: boolean
}

export interface CheckoutPromotionSummary {
  activePromotions: Promotion[]
  loyaltyPointValue: number
  loyaltyPointsRate: number
}

export const SUPPORTED_CHECKOUT_PAYMENT_METHODS: Array<{
  value: PaymentMethod
  label: string
  description: string
}> = [
  {
    value: 'cash_on_delivery',
    label: 'Paiement a la livraison',
    description: 'Le reglement se fait a la reception de la commande.',
  },
  {
    value: 'orange_money',
    label: 'Orange Money',
    description: 'Paiement mobile confirme avant ou apres validation.',
  },
  {
    value: 'mtn_money',
    label: 'MTN Money',
    description: 'Paiement mobile confirme avant ou apres validation.',
  },
  {
    value: 'bank_transfer',
    label: 'Virement bancaire',
    description: 'Pour les commandes professionnelles ou montants importants.',
  },
]

export const CHECKOUT_DELIVERY_TYPES: Array<{
  value: DeliveryType
  label: string
  description: string
}> = [
  {
    value: 'delivery',
    label: 'Livraison',
    description: 'La commande est preparee puis livree a l adresse selectionnee.',
  },
  {
    value: 'pickup',
    label: 'Retrait ferme',
    description: 'Le client recupere sa commande directement chez Legend Farm.',
  },
]

function normalizeValue(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? ''
}

export function findRecommendedDeliveryZone(
  address: CustomerAddress | null,
  zones: DeliveryZone[]
) {
  if (!address) {
    return null
  }

  const zoneValue = normalizeValue(address.zone)
  const cityValue = normalizeValue(address.city)

  return (
    zones.find((zone) => normalizeValue(zone.name) === zoneValue) ??
    zones.find((zone) => normalizeValue(zone.city) === cityValue) ??
    null
  )
}
