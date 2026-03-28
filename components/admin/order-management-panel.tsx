'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateAdminOrder } from '@/lib/actions/admin-orders'
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
import { toast } from '@/hooks/use-toast'
import {
  getDeliveryTypeLabel,
  getPaymentMethodLabel,
  getOrderStatusLabel,
} from '@/lib/order-display'
import type { AdminOrderDetail, DeliveryType, OrderStatus, PaymentMethod } from '@/types'

interface OrderManagementPanelProps {
  order: AdminOrderDetail
}

interface OrderFormState {
  status: OrderStatus
  deliveryType: DeliveryType
  deliveryZone: string
  deliveryDate: string
  deliverySlot: string
  deliveryInstructions: string
  paymentMethod: PaymentMethod | ''
  adminNotes: string
  cancellationReason: string
}

const orderStatuses: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'returned',
]

const deliveryTypes: DeliveryType[] = ['delivery', 'pickup']
const paymentMethods: PaymentMethod[] = [
  'orange_money',
  'mtn_money',
  'bank_transfer',
  'cash_on_delivery',
  'account_credit',
  'loyalty_points',
]

function createOrderFormState(order: AdminOrderDetail): OrderFormState {
  return {
    status: order.status,
    deliveryType: order.delivery_type,
    deliveryZone: order.delivery_zone ?? '',
    deliveryDate: order.delivery_date ?? '',
    deliverySlot: order.delivery_slot ?? '',
    deliveryInstructions: order.delivery_instructions ?? '',
    paymentMethod: order.payment_method ?? '',
    adminNotes: order.admin_notes ?? '',
    cancellationReason: order.cancellation_reason ?? '',
  }
}

export function OrderManagementPanel({ order }: OrderManagementPanelProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState<OrderFormState>(createOrderFormState(order))

  useEffect(() => {
    setForm(createOrderFormState(order))
  }, [order])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    startTransition(async () => {
      const result = await updateAdminOrder({
        id: order.id,
        ...form,
        paymentMethod: form.paymentMethod || null,
      })

      if (!result.success) {
        toast({
          title: 'Commande non mise a jour',
          description: result.error,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Commande mise a jour',
        description: 'Le suivi admin et client a ete rafraichi.',
      })
      router.refresh()
    })
  }

  return (
    <Card className="xl:col-span-2">
      <CardHeader>
        <CardTitle>Pilotage de la commande</CardTitle>
        <CardDescription>
          Changez le statut, les informations logistiques et les notes internes
          sans repasser par Supabase Studio.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="order-status">Statut</Label>
              <select
                id="order-status"
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value as OrderStatus,
                  }))
                }
                className="h-11 rounded-full border border-input bg-background px-4 text-sm"
              >
                {orderStatuses.map((status) => (
                  <option key={status} value={status}>
                    {getOrderStatusLabel(status)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="order-delivery-type">Type de livraison</Label>
              <select
                id="order-delivery-type"
                value={form.deliveryType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    deliveryType: event.target.value as DeliveryType,
                  }))
                }
                className="h-11 rounded-full border border-input bg-background px-4 text-sm"
              >
                {deliveryTypes.map((deliveryType) => (
                  <option key={deliveryType} value={deliveryType}>
                    {getDeliveryTypeLabel(deliveryType)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="order-payment-method">Moyen de paiement</Label>
              <select
                id="order-payment-method"
                value={form.paymentMethod}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    paymentMethod: event.target.value as PaymentMethod | '',
                  }))
                }
                className="h-11 rounded-full border border-input bg-background px-4 text-sm"
              >
                <option value="">Non renseigne</option>
                {paymentMethods.map((paymentMethod) => (
                  <option key={paymentMethod} value={paymentMethod}>
                    {getPaymentMethodLabel(paymentMethod)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="order-delivery-zone">Zone</Label>
              <Input
                id="order-delivery-zone"
                value={form.deliveryZone}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    deliveryZone: event.target.value,
                  }))
                }
                placeholder="Conakry Centre"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="order-delivery-date">Date de livraison</Label>
              <Input
                id="order-delivery-date"
                type="date"
                value={form.deliveryDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    deliveryDate: event.target.value,
                  }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="order-delivery-slot">Creneau</Label>
              <Input
                id="order-delivery-slot"
                value={form.deliverySlot}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    deliverySlot: event.target.value,
                  }))
                }
                placeholder="08h-12h"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="order-delivery-instructions">Instructions livraison</Label>
            <textarea
              id="order-delivery-instructions"
              value={form.deliveryInstructions}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  deliveryInstructions: event.target.value,
                }))
              }
              rows={3}
              className="flex min-h-[7rem] w-full rounded-[1.25rem] border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Consignes pour le livreur, point de contact, repere..."
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="order-admin-notes">Notes admin</Label>
            <textarea
              id="order-admin-notes"
              value={form.adminNotes}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  adminNotes: event.target.value,
                }))
              }
              rows={4}
              className="flex min-h-[8rem] w-full rounded-[1.25rem] border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Informations internes, consignes SAV, remarques stock..."
            />
          </div>

          {form.status === 'cancelled' ? (
            <div className="grid gap-2">
              <Label htmlFor="order-cancellation-reason">Motif d annulation</Label>
              <textarea
                id="order-cancellation-reason"
                value={form.cancellationReason}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    cancellationReason: event.target.value,
                  }))
                }
                rows={3}
                className="flex min-h-[6rem] w-full rounded-[1.25rem] border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Expliquez clairement pourquoi la commande est annulee."
              />
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Enregistrement...' : 'Enregistrer les changements'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
