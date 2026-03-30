'use client'

import { useRef } from 'react'
import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatGNF, formatDateTime } from '@/lib/utils'
import type { AdminOrderDetail } from '@/types'

interface OrderInvoiceProps {
  order: AdminOrderDetail
  shopName?: string
  shopPhone?: string
}

export function OrderInvoice({ order, shopName = 'Legend Farm', shopPhone }: OrderInvoiceProps) {
  const printRef = useRef<HTMLDivElement>(null)

  function handlePrint() {
    const content = printRef.current
    if (!content) return

    const printWindow = window.open('', '_blank', 'width=800,height=900')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <title>Facture ${order.reference}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Georgia', serif; font-size: 13px; color: #111; padding: 32px; max-width: 680px; margin: 0 auto; }
          h1 { font-size: 22px; margin-bottom: 4px; }
          h2 { font-size: 15px; margin-bottom: 12px; font-weight: 600; border-bottom: 1px solid #ccc; padding-bottom: 6px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 32px; }
          .label { color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #666; padding: 8px 6px; border-bottom: 2px solid #111; }
          td { padding: 10px 6px; border-bottom: 1px solid #eee; vertical-align: top; }
          .text-right { text-align: right; }
          .totals { width: 280px; margin-left: auto; }
          .totals td { border: none; padding: 5px 0; }
          .totals .total-row td { font-size: 15px; font-weight: bold; border-top: 2px solid #111; padding-top: 10px; }
          .footer { margin-top: 40px; font-size: 11px; color: #888; text-align: center; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        ${content.innerHTML}
      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 400)
  }

  const clientName = order.guest_name ?? order.customer_name ?? 'Client'
  const clientPhone = order.guest_phone ?? '—'
  const subtotal = order.subtotal
  const discountAmount = order.discount_amount
  const adminDiscount = order.admin_discount ?? 0
  const deliveryFee = order.delivery_fee
  const totalAmount = order.total_amount

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>Facture</CardTitle>
        <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Imprimer
        </Button>
      </CardHeader>
      <CardContent>
        {/* Zone de prévisualisation */}
        <div
          ref={printRef}
          className="rounded-xl border border-border/60 bg-white p-6 text-sm"
        >
          {/* En-tête */}
          <div className="mb-8 flex justify-between gap-6">
            <div>
              <h1 className="font-serif text-2xl font-bold">{shopName}</h1>
              {shopPhone && <p className="mt-1 text-muted-foreground">{shopPhone}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Facture
              </p>
              <p className="mt-1 font-serif text-xl font-semibold">{order.reference}</p>
              <p className="mt-1 text-muted-foreground">
                {formatDateTime(order.created_at)}
              </p>
            </div>
          </div>

          {/* Infos client & livraison */}
          <div className="mb-6 grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Client
              </p>
              <p className="font-medium">{clientName}</p>
              {clientPhone !== '—' && <p className="text-muted-foreground">{clientPhone}</p>}
              {order.customer_email && (
                <p className="text-muted-foreground">{order.customer_email}</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Livraison
              </p>
              <p className="font-medium">
                {order.delivery_type === 'pickup' ? 'Retrait à la ferme' : 'Livraison'}
              </p>
              {order.delivery_zone && (
                <p className="text-muted-foreground">{order.delivery_zone}</p>
              )}
              {order.delivery_date && (
                <p className="text-muted-foreground">
                  Date : {order.delivery_date}
                </p>
              )}
            </div>
          </div>

          {/* Articles */}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-foreground">
                <th className="py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Produit
                </th>
                <th className="py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Qté
                </th>
                <th className="py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Prix unit.
                </th>
                <th className="py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 font-medium">
                    {item.product_name}
                    <span className="ml-1 text-muted-foreground">/ {item.product_unit}</span>
                  </td>
                  <td className="py-3 text-right">{item.quantity}</td>
                  <td className="py-3 text-right">{formatGNF(item.unit_price)}</td>
                  <td className="py-3 text-right font-semibold">{formatGNF(item.total_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totaux */}
          <div className="mt-4 flex justify-end">
            <table className="w-64 text-sm">
              <tbody>
                <tr>
                  <td className="py-1 text-muted-foreground">Sous-total</td>
                  <td className="py-1 text-right">{formatGNF(subtotal)}</td>
                </tr>
                {discountAmount > 0 && (
                  <tr>
                    <td className="py-1 text-muted-foreground">Remise promo</td>
                    <td className="py-1 text-right text-green-700">− {formatGNF(discountAmount)}</td>
                  </tr>
                )}
                {adminDiscount > 0 && (
                  <tr>
                    <td className="py-1 text-muted-foreground">Réduction accordée</td>
                    <td className="py-1 text-right text-green-700">− {formatGNF(adminDiscount)}</td>
                  </tr>
                )}
                {deliveryFee > 0 && (
                  <tr>
                    <td className="py-1 text-muted-foreground">Frais de livraison</td>
                    <td className="py-1 text-right">{formatGNF(deliveryFee)}</td>
                  </tr>
                )}
                <tr className="border-t-2 border-foreground">
                  <td className="pt-3 font-bold">Total</td>
                  <td className="pt-3 text-right font-bold text-lg">{formatGNF(totalAmount)}</td>
                </tr>
                {order.payment_method && (
                  <tr>
                    <td className="pt-1 text-xs text-muted-foreground">Paiement</td>
                    <td className="pt-1 text-right text-xs text-muted-foreground">
                      {order.payment_method === 'cash_on_delivery' && 'À la livraison'}
                      {order.payment_method === 'orange_money' && 'Orange Money'}
                      {order.payment_method === 'mtn_money' && 'MTN Money'}
                      {order.payment_method === 'bank_transfer' && 'Virement bancaire'}
                      {order.payment_method === 'account_credit' && 'Crédit client'}
                      {order.payment_method === 'loyalty_points' && 'Points fidélité'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pied de page */}
          <div className="mt-10 border-t border-border/60 pt-4 text-center text-xs text-muted-foreground">
            <p>Merci pour votre commande chez {shopName}.</p>
            {shopPhone && <p>Pour toute question : {shopPhone}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
