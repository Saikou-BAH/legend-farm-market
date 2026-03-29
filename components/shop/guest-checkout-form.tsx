'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { useCart } from '@/hooks/use-cart'
import { createGuestCheckoutOrder } from '@/lib/actions/guest-checkout'
import { formatGNF } from '@/lib/utils'
import { getCartItemUnitPrice, getCartItemLineTotal } from '@/lib/cart'

const controlClass =
  'h-12 rounded-[1rem] border border-border/70 bg-white/86 text-sm shadow-[0_14px_36px_rgba(18,52,34,0.05)] focus-visible:ring-primary/25 focus-visible:ring-offset-0'

const selectClass =
  'h-12 w-full rounded-[1rem] border border-border/70 bg-white/86 px-4 text-sm shadow-[0_14px_36px_rgba(18,52,34,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-0'

export function GuestCheckoutForm() {
  const router = useRouter()
  const { items, clearCart } = useCart()
  const [isPending, startTransition] = useTransition()
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('pickup')
  const [success, setSuccess] = useState<{ reference: string; totalAmount: number } | null>(null)

  const cartTotal = items.reduce((sum, item) => sum + getCartItemLineTotal(item), 0)
  const today = new Date().toISOString().split('T')[0]

  if (items.length === 0 && !success) {
    return (
      <Card className="bg-white/72">
        <CardContent className="py-10 text-center text-muted-foreground">
          <ShoppingBag className="mx-auto mb-3 h-8 w-8 opacity-40" />
          <p className="font-serif text-xl">Votre panier est vide</p>
          <p className="mt-2 text-sm">Ajoutez des produits avant de passer commande.</p>
        </CardContent>
      </Card>
    )
  }

  if (success) {
    return (
      <Card className="bg-white/72">
        <CardContent className="py-10 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-primary" />
          <p className="font-serif text-2xl">Commande enregistrée</p>
          <p className="mt-2 text-muted-foreground">
            Référence : <span className="font-medium text-foreground">{success.reference}</span>
          </p>
          <p className="mt-1 text-muted-foreground">
            Total : <span className="font-medium text-foreground">{formatGNF(success.totalAmount)}</span>
          </p>
          <p className="mt-4 max-w-sm mx-auto text-sm text-muted-foreground leading-6">
            L&apos;équipe Legend Farm va vous contacter pour confirmer la livraison ou le retrait.
          </p>
        </CardContent>
      </Card>
    )
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)

    startTransition(async () => {
      const result = await createGuestCheckoutOrder({
        guestName: data.get('guestName') as string,
        guestPhone: data.get('guestPhone') as string,
        deliveryType,
        deliveryAddress: deliveryType === 'delivery' ? (data.get('deliveryAddress') as string) : null,
        deliveryDate: (data.get('deliveryDate') as string) || null,
        customerNotes: (data.get('customerNotes') as string) || null,
        paymentMethod: data.get('paymentMethod') as 'cash_on_delivery' | 'orange_money' | 'mtn_money',
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      })

      if (result.success) {
        clearCart()
        setSuccess({ reference: result.data.reference, totalAmount: result.data.totalAmount })
      } else {
        toast({
          title: 'Erreur',
          description: result.error,
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Récapitulatif panier */}
      <Card className="bg-white/72">
        <CardHeader>
          <CardTitle>Votre commande ({items.length} article{items.length > 1 ? 's' : ''})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {items.map((item) => (
            <div key={item.product.id} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {item.product.name} × {item.quantity}
              </span>
              <span className="font-medium">{formatGNF(getCartItemLineTotal(item))}</span>
            </div>
          ))}
          <div className="border-t border-border/70 pt-3 flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatGNF(cartTotal)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Formulaire */}
      <Card className="bg-white/72">
        <CardHeader>
          <CardTitle>Vos coordonnées</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="guest-name">Nom complet *</Label>
                <Input id="guest-name" name="guestName" placeholder="Mamadou Diallo" required disabled={isPending} className={controlClass} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guest-phone">Téléphone *</Label>
                <Input id="guest-phone" name="guestPhone" type="tel" placeholder="620 00 00 00" required disabled={isPending} className={controlClass} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="guest-delivery-type">Mode de réception *</Label>
              <select
                id="guest-delivery-type"
                value={deliveryType}
                onChange={(e) => setDeliveryType(e.target.value as 'delivery' | 'pickup')}
                disabled={isPending}
                className={selectClass}
              >
                <option value="pickup">Retrait à la ferme (gratuit)</option>
                <option value="delivery">Livraison à domicile</option>
              </select>
            </div>

            {deliveryType === 'delivery' && (
              <div className="space-y-2">
                <Label htmlFor="guest-address">Adresse de livraison *</Label>
                <Input
                  id="guest-address"
                  name="deliveryAddress"
                  placeholder="Quartier, commune, ville…"
                  required
                  disabled={isPending}
                  className={controlClass}
                />
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="guest-date">
                  Date souhaitée <span className="text-muted-foreground text-xs">(optionnel)</span>
                </Label>
                <Input
                  id="guest-date"
                  name="deliveryDate"
                  type="date"
                  min={today}
                  disabled={isPending}
                  className={controlClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guest-payment">Mode de paiement *</Label>
                <select
                  id="guest-payment"
                  name="paymentMethod"
                  required
                  disabled={isPending}
                  className={selectClass}
                >
                  <option value="cash_on_delivery">Paiement à la livraison / retrait</option>
                  <option value="orange_money">Orange Money</option>
                  <option value="mtn_money">MTN Money</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="guest-notes">
                Notes <span className="text-muted-foreground text-xs">(optionnel)</span>
              </Label>
              <textarea
                id="guest-notes"
                name="customerNotes"
                placeholder="Instructions particulières, horaires préférés…"
                disabled={isPending}
                rows={3}
                className="min-h-24 w-full rounded-[1rem] border border-border/70 bg-white/86 px-4 py-3 text-sm shadow-[0_14px_36px_rgba(18,52,34,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-0 disabled:opacity-50"
              />
            </div>

            <Button type="submit" disabled={isPending} className="w-full sm:w-auto gap-2" size="lg">
              <ShoppingBag className="h-4 w-4" />
              {isPending ? 'Envoi en cours…' : `Confirmer la commande — ${formatGNF(cartTotal)}`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
