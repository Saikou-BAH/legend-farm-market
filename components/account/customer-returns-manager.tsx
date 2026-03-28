'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createCustomerReturnRequest } from '@/lib/actions/returns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import type { ReturnRequest } from '@/types'
import { formatDateTime } from '@/lib/utils'

interface CustomerReturnsManagerProps {
  orders: Array<{
    id: string
    reference: string
    delivered_at: string | null
    items: Array<{
      order_item_id: string
      product_name: string
      product_unit: string
      quantity: number
    }>
  }>
  returns: ReturnRequest[]
}

const reasonLabels = {
  defective: 'Produit defectueux',
  poor_quality: 'Qualite insuffisante',
  wrong_order: 'Mauvaise commande',
  wrong_quantity: 'Quantite incorrecte',
  other: 'Autre',
} as const

const resolutionLabels = {
  refund: 'Remboursement',
  credit: 'Avoir',
  exchange: 'Echange',
} as const

export function CustomerReturnsManager({
  orders,
  returns,
}: CustomerReturnsManagerProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [orderId, setOrderId] = useState(orders[0]?.id ?? '')
  const [reason, setReason] = useState<keyof typeof reasonLabels>('poor_quality')
  const [resolution, setResolution] = useState<keyof typeof resolutionLabels>('refund')
  const [reasonDetails, setReasonDetails] = useState('')

  const eligibleOrders = useMemo(() => orders.filter((order) => order.items.length > 0), [orders])
  const selectedOrder = useMemo(
    () => eligibleOrders.find((order) => order.id === orderId) ?? null,
    [eligibleOrders, orderId]
  )
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, string>>(
    Object.fromEntries((eligibleOrders[0]?.items ?? []).map((item) => [item.order_item_id, '']))
  )

  function resetSelectedQuantities(nextOrderId: string) {
    const nextOrder = eligibleOrders.find((order) => order.id === nextOrderId) ?? null
    const nextQuantities = Object.fromEntries(
      (nextOrder?.items ?? []).map((item) => [item.order_item_id, ''])
    )
    setOrderId(nextOrderId)
    setSelectedQuantities(nextQuantities)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Demander un retour</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {eligibleOrders.length > 0 ? (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-2 text-sm">
                  <span className="font-medium">Commande</span>
                  <select
                    value={orderId}
                    onChange={(event) => resetSelectedQuantities(event.target.value)}
                    className="flex h-11 w-full rounded-2xl border border-input bg-background px-4 py-2 text-sm"
                  >
                    {eligibleOrders.map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.reference}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm">
                  <span className="font-medium">Motif</span>
                  <select
                    value={reason}
                    onChange={(event) =>
                      setReason(event.target.value as keyof typeof reasonLabels)
                    }
                    className="flex h-11 w-full rounded-2xl border border-input bg-background px-4 py-2 text-sm"
                  >
                    {Object.entries(reasonLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm">
                  <span className="font-medium">Resolution souhaitee</span>
                  <select
                    value={resolution}
                    onChange={(event) =>
                      setResolution(event.target.value as keyof typeof resolutionLabels)
                    }
                    className="flex h-11 w-full rounded-2xl border border-input bg-background px-4 py-2 text-sm"
                  >
                    {Object.entries(resolutionLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {selectedOrder ? (
                <div className="space-y-3 rounded-[1.25rem] border border-border/70 bg-muted/15 p-4">
                  <p className="text-sm font-medium">Lignes concernees</p>
                  {selectedOrder.items.map((item) => (
                    <div
                      key={item.order_item_id}
                      className="grid gap-3 rounded-2xl border border-border/70 bg-background p-4 md:grid-cols-[1fr_10rem]"
                    >
                      <div className="text-sm">
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-muted-foreground">
                          Quantite commandee: {item.quantity} x {item.product_unit}
                        </p>
                      </div>
                      <label className="space-y-2 text-sm">
                        <span className="font-medium">Quantite retournee</span>
                        <input
                          type="number"
                          min="0"
                          max={item.quantity}
                          value={selectedQuantities[item.order_item_id] ?? ''}
                          onChange={(event) =>
                            setSelectedQuantities((current) => ({
                              ...current,
                              [item.order_item_id]: event.target.value,
                            }))
                          }
                          className="flex h-11 w-full rounded-2xl border border-input bg-background px-4 py-2 text-sm"
                        />
                      </label>
                    </div>
                  ))}
                </div>
              ) : null}

              <label className="space-y-2 text-sm">
                <span className="font-medium">Precisions</span>
                <textarea
                  value={reasonDetails}
                  onChange={(event) => setReasonDetails(event.target.value)}
                  className="flex min-h-[8rem] w-full rounded-[1.25rem] border border-input bg-background px-4 py-3 text-sm"
                  placeholder="Expliquez rapidement le probleme constate et ce que vous attendez."
                />
              </label>

              <Button
                type="button"
                disabled={isPending || !orderId}
                onClick={() => {
                  startTransition(async () => {
                    const result = await createCustomerReturnRequest({
                      orderId,
                      reason,
                      resolution,
                      reasonDetails,
                      items: Object.entries(selectedQuantities)
                        .map(([orderItemId, quantity]) => ({
                          orderItemId,
                          quantity: Number.parseInt(quantity || '0', 10) || 0,
                        }))
                        .filter((item) => item.quantity > 0),
                    })

                    if (!result.success) {
                      toast({
                        title: 'Demande non enregistree',
                        description: result.error,
                        variant: 'destructive',
                      })
                      return
                    }

                    toast({
                      title: 'Demande enregistree',
                      description: 'Le retour est maintenant visible dans votre espace client.',
                    })

                    setReasonDetails('')
                    resetSelectedQuantities(orderId)
                    router.refresh()
                  })
                }}
              >
                {isPending ? 'Envoi en cours...' : 'Envoyer la demande'}
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucune commande eligible pour un retour n est disponible pour le moment.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historique des retours</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {returns.length > 0 ? (
            returns.map((returnRequest) => (
              <div key={returnRequest.id} className="rounded-2xl border border-border/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{returnRequest.reference}</p>
                    <p className="text-sm text-muted-foreground">
                      Cree le {formatDateTime(returnRequest.created_at)}
                    </p>
                  </div>
                  <p className="text-sm font-medium capitalize">{returnRequest.status}</p>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {reasonLabels[returnRequest.reason]}
                  {returnRequest.reason_details ? ` - ${returnRequest.reason_details}` : ''}
                </p>
                {returnRequest.items && returnRequest.items.length > 0 ? (
                  <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {returnRequest.items.map((item) => (
                      <p key={item.id}>
                        {item.product_name ?? 'Produit'}: {item.quantity}
                        {item.product_unit ? ` x ${item.product_unit}` : ''}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucun retour n a encore ete enregistre.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
