'use client'

import * as React from 'react'
import Link from 'next/link'
import { Minus, Plus } from 'lucide-react'
import { StockNotificationForm } from '@/components/shop/stock-notification-form'
import { WhatsAppButton } from '@/components/shop/whatsapp-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import { useCart } from '@/hooks/use-cart'
import {
  clampCartQuantity,
  getCartItemLineTotal,
  getCartItemUnitPrice,
  isProductPurchasable,
} from '@/lib/cart'
import { formatGNF } from '@/lib/utils'
import type { Product } from '@/types'

interface ProductPurchaseCardProps {
  product: Product
  shopEmail: string | null
  shopPhone: string | null
}

export function ProductPurchaseCard({
  product,
  shopEmail,
  shopPhone,
}: ProductPurchaseCardProps) {
  const { addItem } = useCart()
  const canAdd = isProductPurchasable(product)
  const [quantity, setQuantity] = React.useState(1)
  const previewItem = {
    product,
    quantity,
    added_at: '',
    updated_at: '',
  }
  const unitPrice = getCartItemUnitPrice(previewItem)
  const lineTotal = getCartItemLineTotal(previewItem)

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-2xl">Commande</CardTitle>
          <Badge variant={canAdd ? 'secondary' : 'outline'}>
            {canAdd ? 'Ajout au panier actif' : 'Ajout au panier bloque'}
          </Badge>
        </div>
        <CardDescription>
          Le panier est maintenant persistant. La creation de commande finale sera branchee a l etape checkout complete.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Quantite</p>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={quantity <= 1}
              onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="min-w-20 rounded-full border border-border/70 px-4 py-2 text-center text-sm font-medium">
              {quantity}
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={!canAdd || quantity >= Math.max(product.stock_quantity, 1)}
              onClick={() =>
                setQuantity((current) =>
                  Math.min(Math.max(product.stock_quantity, 1), clampCartQuantity(current + 1))
                )
              }
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 px-4 py-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Prix unitaire actuel</span>
            <span className="font-medium">{formatGNF(unitPrice)}</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-muted-foreground">Total estime</span>
            <span className="font-semibold">{formatGNF(lineTotal)}</span>
          </div>
        </div>

        <Button
          type="button"
          className="w-full"
          disabled={!canAdd}
          onClick={() => {
            const result = addItem(product, quantity)

            toast({
              title: result.success ? 'Panier mis a jour' : 'Ajout impossible',
              description: result.message,
              variant: result.success ? 'default' : 'destructive',
            })
          }}
        >
          Ajouter {quantity > 1 ? `${quantity} articles` : 'au panier'}
        </Button>

        {!canAdd ? (
          <StockNotificationForm
            productId={product.id}
            productName={product.name}
          />
        ) : null}

        <div className="space-y-3">
          {shopPhone ? (
            <Button asChild variant="outline" className="w-full">
              <a href={`tel:${shopPhone}`}>Appeler la ferme</a>
            </Button>
          ) : null}
          {shopPhone ? (
            <WhatsAppButton
              phone={shopPhone}
              label="Parler sur WhatsApp"
              className="w-full"
              message={`Bonjour Legend Farm, je souhaite des informations sur ${product.name}.`}
            />
          ) : null}
          {shopEmail ? (
            <Button asChild variant="ghost" className="w-full">
              <a href={`mailto:${shopEmail}`}>Envoyer un email</a>
            </Button>
          ) : null}
          <Button asChild variant="ghost" className="w-full">
            <Link href="/cart">Voir mon panier</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
