'use client'

import * as React from 'react'
import Link from 'next/link'
import { Minus, Package, Plus, ShieldCheck, Sparkles, Truck } from 'lucide-react'
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
    <Card className="surface-panel border-white/80">
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-2xl">Commande</CardTitle>
          <Badge
            variant={canAdd ? 'secondary' : 'outline'}
            className={canAdd ? 'bg-secondary/90' : undefined}
          >
            {canAdd ? 'Ajout au panier actif' : 'Ajout au panier bloque'}
          </Badge>
        </div>
        <CardDescription>
          Ajoutez ce produit au panier puis finalisez votre commande avec livraison ou retrait ferme, sans perdre vos quantites.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[1.2rem] border border-border/70 bg-white/70 p-3 text-sm">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <p className="mt-3 font-medium">Tarifs fiables</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Montants relus cote serveur avant validation.
            </p>
          </div>
          <div className="rounded-[1.2rem] border border-border/70 bg-white/70 p-3 text-sm">
            <Truck className="h-4 w-4 text-primary" />
            <p className="mt-3 font-medium">Livraison claire</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Choix entre livraison et retrait selon la configuration active.
            </p>
          </div>
          <div className="rounded-[1.2rem] border border-border/70 bg-white/70 p-3 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="mt-3 font-medium">Commande suivie</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Confirmation et suivi disponibles dans votre compte client.
            </p>
          </div>
        </div>

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
            <div className="min-w-24 rounded-full border border-border/70 bg-white/80 px-4 py-2 text-center text-sm font-semibold shadow-[0_10px_24px_rgba(22,54,36,0.05)]">
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

        {canAdd ? (
          <div className="flex items-center gap-2 rounded-[1.2rem] border px-3 py-2 text-sm">
            <Package className="h-4 w-4 shrink-0" />
            {product.stock_quantity <= 10 ? (
              <span className="text-amber-700">
                Stock limité — {product.stock_quantity} {product.unit}
                {product.stock_quantity > 1 ? 's' : ''} disponible
                {product.stock_quantity > 1 ? 's' : ''}
              </span>
            ) : (
              <span className="text-primary">
                {product.stock_quantity} {product.unit}s disponibles
              </span>
            )}
          </div>
        ) : null}

        <div className="rounded-[1.45rem] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.85),rgba(245,249,241,0.95))] px-4 py-4 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Prix unitaire actuel</span>
            <span className="font-medium">{formatGNF(unitPrice)}</span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/60 pt-3">
            <span className="text-muted-foreground">Total estime</span>
            <span className="text-lg font-semibold">{formatGNF(lineTotal)}</span>
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

        <div className="space-y-3 border-t border-border/60 pt-2">
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
