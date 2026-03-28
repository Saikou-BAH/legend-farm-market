'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ProductVisual } from '@/components/shop/product-visual'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { useCart } from '@/hooks/use-cart'
import { createCheckoutOrder } from '@/lib/actions/checkout'
import { getCheckoutFinancialSummary } from '@/lib/checkout-pricing'
import {
  CHECKOUT_DELIVERY_TYPES,
  findRecommendedDeliveryZone,
  SUPPORTED_CHECKOUT_PAYMENT_METHODS,
} from '@/lib/checkout'
import { getCartItemLineTotal, getCartItemUnitPrice, validateCartItem } from '@/lib/cart'
import { getDeliveryTypeLabel, getPaymentMethodLabel } from '@/lib/order-display'
import { getProductPrimaryImage } from '@/lib/shop-catalog'
import { cn, formatGNF } from '@/lib/utils'
import type {
  CustomerAddress,
  CustomerProfile,
  DeliveryType,
  DeliveryZone,
  Promotion,
} from '@/types'

interface CheckoutPageClientProps {
  activePromotions: Promotion[]
  profile: CustomerProfile
  addresses: CustomerAddress[]
  deliveryZones: DeliveryZone[]
  loyaltyPointValue: number
  loyaltyPointsRate: number
  minOrderAmount: number
}

function SelectableCard({
  active,
  children,
  disabled = false,
  onClick,
}: {
  active: boolean
  children: React.ReactNode
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'w-full rounded-[1.5rem] border p-4 text-left transition-colors',
        active
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border/70 bg-background hover:border-primary/40 hover:bg-muted/20',
        disabled && 'cursor-not-allowed opacity-60 hover:border-border/70 hover:bg-background'
      )}
    >
      {children}
    </button>
  )
}

export function CheckoutPageClient({
  activePromotions,
  profile,
  addresses,
  deliveryZones,
  loyaltyPointValue,
  loyaltyPointsRate,
  minOrderAmount,
}: CheckoutPageClientProps) {
  const router = useRouter()
  const { clearCart, hydrated, items, summary } = useCart()
  const [isPending, startTransition] = useTransition()

  const defaultAddressId = addresses.find((address) => address.is_default)?.id ?? addresses[0]?.id ?? ''
  const defaultDeliveryType: DeliveryType =
    addresses.length > 0 && deliveryZones.length > 0 ? 'delivery' : 'pickup'

  const [deliveryType, setDeliveryType] = useState<DeliveryType>(defaultDeliveryType)
  const [selectedAddressId, setSelectedAddressId] = useState(defaultAddressId)
  const [selectedZoneId, setSelectedZoneId] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [deliveryInstructions, setDeliveryInstructions] = useState('')
  const [customerNotes, setCustomerNotes] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [pointsToRedeem, setPointsToRedeem] = useState('')
  const [useAccountCredit, setUseAccountCredit] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState(
    SUPPORTED_CHECKOUT_PAYMENT_METHODS[0]?.value ?? 'cash_on_delivery'
  )

  const selectedAddress = useMemo(
    () => addresses.find((address) => address.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId]
  )

  const selectedZone = useMemo(
    () => deliveryZones.find((zone) => zone.id === selectedZoneId) ?? null,
    [deliveryZones, selectedZoneId]
  )

  useEffect(() => {
    if (deliveryType !== 'delivery') {
      return
    }

    const recommendedZone = findRecommendedDeliveryZone(selectedAddress, deliveryZones)

    if (!selectedZoneId) {
      setSelectedZoneId(recommendedZone?.id ?? deliveryZones[0]?.id ?? '')
    }
  }, [deliveryType, deliveryZones, selectedAddress, selectedZoneId])

  useEffect(() => {
    if (!selectedZone) {
      setSelectedSlot('')
      return
    }

    const slots = Array.isArray(selectedZone.available_slots) ? selectedZone.available_slots : []

    if (slots.length === 0) {
      setSelectedSlot('')
      return
    }

    if (!selectedSlot || !slots.includes(selectedSlot)) {
      setSelectedSlot(slots[0] ?? '')
    }
  }, [selectedSlot, selectedZone])

  const invalidLines = items.filter((item) => validateCartItem(item).status === 'invalid')
  const hasInvalidLines = invalidLines.length > 0
  const requiresSavedAddress = deliveryType === 'delivery'
  const isDeliveryUnavailable = deliveryType === 'delivery' && deliveryZones.length === 0
  const hasAddressChoice = selectedAddressId.length > 0
  const hasZoneChoice = selectedZoneId.length > 0
  const zoneSlots = Array.isArray(selectedZone?.available_slots) ? selectedZone.available_slots : []
  const requiresSlot = deliveryType === 'delivery' && zoneSlots.length > 0
  const deliveryFee = deliveryType === 'delivery' ? selectedZone?.delivery_fee ?? 0 : 0
  const requiredMinOrderAmount = Math.max(
    minOrderAmount,
    deliveryType === 'delivery' ? selectedZone?.min_order_amount ?? 0 : 0
  )
  const isBelowMinOrder = summary.subtotal < requiredMinOrderAmount
  const requestedPoints = Math.max(0, Number.parseInt(pointsToRedeem || '0', 10) || 0)
  const financialSummary = useMemo(
    () =>
      getCheckoutFinancialSummary({
        promotions: activePromotions,
        promoCode: promoCode || null,
        customerType: profile.customer_type,
        customerLevel: profile.loyalty_level,
        zoneName: deliveryType === 'delivery' ? selectedZone?.name ?? null : null,
        subtotal: summary.subtotal,
        deliveryFee,
        lines: items.map((item) => ({ productId: item.product.id })),
        requestedPoints,
        availablePoints: profile.loyalty_points,
        pointValue: loyaltyPointValue,
        useAccountCredit,
        availableCreditBalance: profile.credit_balance,
      }),
    [
      activePromotions,
      deliveryFee,
      deliveryType,
      items,
      loyaltyPointValue,
      profile.credit_balance,
      profile.customer_type,
      profile.loyalty_level,
      profile.loyalty_points,
      promoCode,
      requestedPoints,
      selectedZone?.name,
      summary.subtotal,
      useAccountCredit,
    ]
  )
  const estimatedPointsEarned = Math.max(
    0,
    Math.floor(financialSummary.totalAmount * Math.max(0, loyaltyPointsRate))
  )

  if (!hydrated) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Chargement de votre recapitulatif et de vos options de commande...
        </CardContent>
      </Card>
    )
  }

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyState
          title="Votre panier est vide"
          description="Ajoutez d'abord des produits a votre panier avant de passer commande."
        />
        <Button asChild>
          <Link href="/products">Retourner au catalogue</Link>
        </Button>
      </div>
    )
  }

  const canSubmit =
    !isPending &&
    !hasInvalidLines &&
    (!requiresSavedAddress || (addresses.length > 0 && hasAddressChoice)) &&
    (!requiresSavedAddress || hasZoneChoice) &&
    !isDeliveryUnavailable &&
    (!requiresSlot || selectedSlot.length > 0) &&
    !isBelowMinOrder &&
    !financialSummary.error

  const today = new Date()
  const minDeliveryDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-')

  function submitCheckout() {
    if (!canSubmit) {
      toast({
        title: 'Checkout incomplet',
        description:
          "Corrigez les lignes invalides et completez les informations de livraison avant de valider la commande.",
        variant: 'destructive',
      })
      return
    }

    startTransition(async () => {
      const result = await createCheckoutOrder({
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        deliveryType,
        deliveryAddressId: deliveryType === 'delivery' ? selectedAddressId : null,
        deliveryZoneId: deliveryType === 'delivery' ? selectedZoneId : null,
        deliverySlot: deliveryType === 'delivery' ? selectedSlot : null,
        deliveryDate: deliveryDate || null,
        deliveryInstructions: deliveryType === 'delivery' ? deliveryInstructions : null,
        customerNotes: customerNotes || null,
        paymentMethod,
        promoCode: promoCode || null,
        pointsToRedeem: requestedPoints,
        useAccountCredit,
      })

      if (!result.success) {
        toast({
          title: 'Commande non creee',
          description: result.error,
          variant: 'destructive',
        })
        return
      }

      clearCart()
      toast({
        title: 'Commande enregistree',
        description: `Votre commande ${result.data.reference} a bien ete creee.`,
      })
      router.push(`/order-confirmation/${result.data.orderId}`)
      router.refresh()
    })
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>Informations client</CardTitle>
              <Badge variant="secondary">Compte authentifie</Badge>
            </div>
            <CardDescription>
              La commande sera rattachee au profil client connecte.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm md:grid-cols-2">
            <div className="rounded-[1.25rem] border border-border/70 bg-muted/15 p-4">
              <p className="text-muted-foreground">Client</p>
              <p className="mt-1 font-medium">{profile.full_name}</p>
              <p className="text-muted-foreground">{profile.email}</p>
            </div>
            <div className="rounded-[1.25rem] border border-border/70 bg-muted/15 p-4">
              <p className="text-muted-foreground">Telephone</p>
              <p className="mt-1 font-medium">
                {profile.phone ?? 'A completer dans votre profil client'}
              </p>
              <p className="text-muted-foreground">
                Type de compte: {profile.customer_type}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mode de retrait</CardTitle>
            <CardDescription>
              Choisissez entre la livraison et le retrait a la ferme.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {CHECKOUT_DELIVERY_TYPES.map((option) => {
              const disabled =
                option.value === 'delivery' &&
                (addresses.length === 0 || deliveryZones.length === 0)

              return (
                <SelectableCard
                  key={option.value}
                  active={deliveryType === option.value}
                  disabled={disabled || isPending}
                  onClick={() => setDeliveryType(option.value)}
                >
                  <div className="space-y-1">
                    <p className="font-medium">{option.label}</p>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                    {disabled ? (
                      <p className="text-sm text-destructive">
                        {addresses.length === 0
                          ? 'Ajoutez une adresse client pour activer la livraison.'
                          : 'Aucune zone de livraison active nest encore configuree.'}
                      </p>
                    ) : null}
                  </div>
                </SelectableCard>
              )
            })}
          </CardContent>
        </Card>

        {deliveryType === 'delivery' ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Adresse de livraison</CardTitle>
                <CardDescription>
                  Selectionnez une adresse deja enregistree pour cette commande.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {addresses.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {addresses.map((address) => (
                      <SelectableCard
                        key={address.id}
                        active={selectedAddressId === address.id}
                        disabled={isPending}
                        onClick={() => setSelectedAddressId(address.id)}
                      >
                        <div className="space-y-1 text-sm">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{address.label ?? 'Adresse'}</p>
                            {address.is_default ? (
                              <Badge variant="secondary">Par defaut</Badge>
                            ) : null}
                          </div>
                          <p className="text-muted-foreground">{address.full_address}</p>
                          <p className="text-muted-foreground">
                            {address.city} • {address.zone}
                          </p>
                          {address.phone ? (
                            <p className="text-muted-foreground">{address.phone}</p>
                          ) : null}
                        </div>
                      </SelectableCard>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[1.25rem] border border-dashed border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
                    Aucune adresse client n est encore enregistree. Pour cette iteration, le
                    retrait a la ferme reste disponible immediatement.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Zone et creneau</CardTitle>
                <CardDescription>
                  Les frais et le montant minimum varient selon la zone choisie.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  {deliveryZones.map((zone) => (
                    <SelectableCard
                      key={zone.id}
                      active={selectedZoneId === zone.id}
                      disabled={isPending}
                      onClick={() => setSelectedZoneId(zone.id)}
                    >
                      <div className="space-y-1 text-sm">
                        <p className="font-medium">{zone.name}</p>
                        <p className="text-muted-foreground">{zone.city}</p>
                        <p className="text-muted-foreground">
                          Frais: {formatGNF(zone.delivery_fee)}
                        </p>
                        {zone.min_order_amount > 0 ? (
                          <p className="text-muted-foreground">
                            Minimum: {formatGNF(zone.min_order_amount)}
                          </p>
                        ) : null}
                        {zone.estimated_delay ? (
                          <p className="text-muted-foreground">
                            Delai estime: {zone.estimated_delay}
                          </p>
                        ) : null}
                      </div>
                    </SelectableCard>
                  ))}
                </div>

                {zoneSlots.length > 0 ? (
                  <div className="space-y-2">
                    <Label htmlFor="delivery-slot">Creneau souhaite</Label>
                    <select
                      id="delivery-slot"
                      value={selectedSlot}
                      onChange={(event) => setSelectedSlot(event.target.value)}
                      disabled={isPending}
                      className="flex h-12 w-full rounded-[1rem] border border-input bg-background px-4 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {zoneSlots.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="delivery-date">Date souhaitee</Label>
                    <Input
                      id="delivery-date"
                      type="date"
                      min={minDeliveryDate}
                      value={deliveryDate}
                      onChange={(event) => setDeliveryDate(event.target.value)}
                      disabled={isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delivery-instructions">Instructions de livraison</Label>
                    <textarea
                      id="delivery-instructions"
                      value={deliveryInstructions}
                      onChange={(event) => setDeliveryInstructions(event.target.value)}
                      disabled={isPending}
                      placeholder="Repere, contact a prevenir, particularites d acces..."
                      className="min-h-24 w-full rounded-[1rem] border border-input bg-background px-4 py-3 text-sm ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Retrait a la ferme</CardTitle>
              <CardDescription>
                Aucun frais de livraison nest ajoute. Vous pourrez confirmer les details de retrait apres validation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-[1.25rem] border border-border/70 bg-muted/15 p-4">
                <p className="font-medium">Mode retenu: {getDeliveryTypeLabel(deliveryType)}</p>
                <p className="mt-1 text-muted-foreground">
                  La commande sera enregistree en attente, puis confirmee par l equipe Legend Farm.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickup-date">Date souhaitee</Label>
                <Input
                  id="pickup-date"
                  type="date"
                  min={minDeliveryDate}
                  value={deliveryDate}
                  onChange={(event) => setDeliveryDate(event.target.value)}
                  disabled={isPending}
                />
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Mode de paiement</CardTitle>
            <CardDescription>
              {financialSummary.remainingPaymentAmount > 0
                ? 'Le solde restant sera regle selon le mode choisi ci-dessous.'
                : 'Le solde de cette commande sera entierement couvre par vos avantages client.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {SUPPORTED_CHECKOUT_PAYMENT_METHODS.map((option) => (
              <SelectableCard
                key={option.value}
                active={paymentMethod === option.value}
                disabled={isPending}
                onClick={() => setPaymentMethod(option.value)}
              >
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{option.label}</p>
                  <p className="text-muted-foreground">{option.description}</p>
                </div>
              </SelectableCard>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Promotions et avantages</CardTitle>
            <CardDescription>
              Appliquez un code promo, utilisez vos points et votre credit client sans jamais figer les prix dans l interface.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="font-medium">Code promo</span>
                <Input
                  value={promoCode}
                  onChange={(event) => setPromoCode(event.target.value)}
                  disabled={isPending}
                  placeholder="LFS10"
                />
              </label>

              <label className="space-y-2 text-sm">
                <span className="font-medium">Points a utiliser</span>
                <Input
                  type="number"
                  min="0"
                  max={profile.loyalty_points}
                  value={pointsToRedeem}
                  onChange={(event) => setPointsToRedeem(event.target.value)}
                  disabled={isPending || profile.loyalty_points <= 0}
                  placeholder="0"
                />
              </label>
            </div>

            <label className="flex items-start gap-3 rounded-[1.25rem] border border-border/70 bg-muted/20 p-4 text-sm">
              <input
                type="checkbox"
                checked={useAccountCredit}
                onChange={(event) => setUseAccountCredit(event.target.checked)}
                disabled={isPending || profile.credit_balance <= 0}
                className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-muted-foreground">
                Utiliser mon credit client disponible ({formatGNF(profile.credit_balance)}).
              </span>
            </label>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.25rem] border border-border/70 bg-muted/15 p-4 text-sm">
                <p className="text-muted-foreground">Points disponibles</p>
                <p className="mt-1 font-medium">{profile.loyalty_points}</p>
              </div>
              <div className="rounded-[1.25rem] border border-border/70 bg-muted/15 p-4 text-sm">
                <p className="text-muted-foreground">Valeur d un point</p>
                <p className="mt-1 font-medium">{formatGNF(loyaltyPointValue)}</p>
              </div>
              <div className="rounded-[1.25rem] border border-border/70 bg-muted/15 p-4 text-sm">
                <p className="text-muted-foreground">Points estimes apres commande</p>
                <p className="mt-1 font-medium">{estimatedPointsEarned}</p>
              </div>
            </div>

            {financialSummary.error ? (
              <div className="rounded-[1rem] border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {financialSummary.error}
              </div>
            ) : null}

            {financialSummary.appliedPromotions.length > 0 ? (
              <div className="space-y-3 rounded-[1.25rem] border border-primary/20 bg-primary/5 p-4 text-sm">
                <p className="font-medium">Promotions appliquees</p>
                {financialSummary.appliedPromotions.map((promotion) => (
                  <div
                    key={promotion.promotionId}
                    className="flex items-center justify-between gap-4"
                  >
                    <span className="text-muted-foreground">
                      {promotion.name}
                      {promotion.code ? ` (${promotion.code})` : ''}
                    </span>
                    <span className="font-medium">-{formatGNF(promotion.amount)}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Note de commande</CardTitle>
            <CardDescription>
              Ajoutez une precision utile pour l equipe Legend Farm si besoin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="customer-notes" className="sr-only">
              Note de commande
            </Label>
            <textarea
              id="customer-notes"
              value={customerNotes}
              onChange={(event) => setCustomerNotes(event.target.value)}
              disabled={isPending}
              placeholder="Informations complementaires, preferences de contact, consignes utiles..."
              className="min-h-28 w-full rounded-[1rem] border border-input bg-background px-4 py-3 text-sm ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </CardContent>
        </Card>
      </section>

      <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>Recapitulatif final</CardTitle>
              <Badge variant="secondary">{summary.totalQuantity} article(s)</Badge>
            </div>
            <CardDescription>
              Les produits sont reverifies cote serveur juste avant la creation de la commande.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item) => {
              const validation = validateCartItem(item)
              const unitPrice = getCartItemUnitPrice(item)
              const lineTotal = getCartItemLineTotal(item)

              return (
                <div
                  key={item.product.id}
                  className="grid gap-3 rounded-[1.25rem] border border-border/70 p-3"
                >
                  <div className="grid grid-cols-[4.5rem_1fr] gap-3">
                    <ProductVisual
                      name={item.product.name}
                      imageUrl={getProductPrimaryImage(item.product)}
                      className="h-20"
                    />
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-muted-foreground">
                        {item.quantity} x {item.product.unit}
                      </p>
                      <p className="text-muted-foreground">
                        {formatGNF(unitPrice)} / unite
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total ligne</span>
                    <span className="font-medium">{formatGNF(lineTotal)}</span>
                  </div>

                  {validation.status !== 'valid' ? (
                    <p
                      className={
                        validation.status === 'invalid'
                          ? 'text-sm text-destructive'
                          : 'text-sm text-muted-foreground'
                      }
                    >
                      {validation.message}
                    </p>
                  ) : null}
                </div>
              )
            })}

            <div className="space-y-3 border-t border-border/70 pt-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Sous-total</span>
                <span>{formatGNF(summary.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Livraison</span>
                <span>{formatGNF(deliveryFee)}</span>
              </div>
              {financialSummary.discountAmount > 0 ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Remises promotions</span>
                  <span>-{formatGNF(financialSummary.discountAmount)}</span>
                </div>
              ) : null}
              {financialSummary.pointsPaymentAmount > 0 ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Points fidelite utilises</span>
                  <span>-{formatGNF(financialSummary.pointsPaymentAmount)}</span>
                </div>
              ) : null}
              {financialSummary.accountCreditApplied > 0 ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Credit client utilise</span>
                  <span>-{formatGNF(financialSummary.accountCreditApplied)}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Paiement</span>
                <span>{getPaymentMethodLabel(paymentMethod)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border/70 pt-3 font-medium">
                <span>Total commande</span>
                <span>{formatGNF(financialSummary.totalAmount)}</span>
              </div>
              <div className="flex items-center justify-between font-medium">
                <span>Reste a regler</span>
                <span>{formatGNF(financialSummary.remainingPaymentAmount)}</span>
              </div>
            </div>

            {requiredMinOrderAmount > 0 ? (
              <div
                className={cn(
                  'rounded-[1rem] border px-4 py-3 text-sm',
                  isBelowMinOrder
                    ? 'border-destructive/40 bg-destructive/10 text-destructive'
                    : 'border-primary/20 bg-primary/10 text-primary'
                )}
              >
                Minimum applicable: {formatGNF(requiredMinOrderAmount)}.
              </div>
            ) : null}

            {hasInvalidLines ? (
              <div className="rounded-[1rem] border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                Corrigez les lignes invalides dans le panier avant de finaliser la commande.
              </div>
            ) : null}

            <div className="grid gap-3">
              <Button type="button" disabled={!canSubmit} onClick={submitCheckout}>
                {isPending ? 'Creation de la commande...' : 'Valider ma commande'}
              </Button>
              <Button asChild type="button" variant="outline">
                <Link href="/cart">Retour au panier</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}
