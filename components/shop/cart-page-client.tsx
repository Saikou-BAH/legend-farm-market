'use client'

import Link from 'next/link'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { ProductVisual } from '@/components/shop/product-visual'
import { CartSidebar } from '@/components/shop/cart-sidebar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { toast } from '@/hooks/use-toast'
import { useCart } from '@/hooks/use-cart'
import {
  clampCartQuantity,
  getCartItemLineTotal,
  getCartItemUnitPrice,
  validateCartItem,
} from '@/lib/cart'
import { getProductAvailability, getProductPrimaryImage } from '@/lib/shop-catalog'
import { formatGNF } from '@/lib/utils'

export function CartPageClient() {
  const { clearCart, hydrated, items, removeItem, summary, updateQuantity } = useCart()

  if (!hydrated) {
    return (
      <main className="container grid gap-8 py-12 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-5">
          <div className="space-y-2">
            <h1 className="font-serif text-4xl">Panier</h1>
            <p className="text-muted-foreground">Chargement de votre panier persistant...</p>
          </div>
          <Card className="border-dashed">
            <CardContent className="p-6 text-sm text-muted-foreground">
              Nous relisons les produits que vous avez deja prepares.
            </CardContent>
          </Card>
        </section>

        <CartSidebar
          lineCount={0}
          totalQuantity={0}
          subtotal={0}
          canCheckout={false}
          helperText="Le panier sera disponible des que les donnees locales seront relues."
        />
      </main>
    )
  }

  if (items.length === 0) {
    return (
      <main className="container grid gap-8 py-12 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-5">
          <div className="space-y-2">
            <h1 className="font-serif text-4xl">Panier</h1>
            <p className="text-muted-foreground">
              Votre panier sauvegarde maintenant les produits ajoutes depuis la boutique.
            </p>
          </div>

          <EmptyState
            title="Panier encore vide"
            description="Ajoutez vos premiers produits depuis le catalogue pour preparer une commande."
          />

          <Button asChild>
            <Link href="/products">Explorer le catalogue</Link>
          </Button>
        </section>

        <CartSidebar
          lineCount={0}
          totalQuantity={0}
          subtotal={0}
          canCheckout={false}
          helperText="Ajoutez au moins un produit pour preparer votre checkout."
        />
      </main>
    )
  }

  const canCheckout = summary.invalidLineCount === 0

  return (
    <main className="container grid gap-8 py-12 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="space-y-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-serif text-4xl">Panier</h1>
            <Badge variant="secondary">{summary.totalQuantity} article(s)</Badge>
          </div>
          <p className="text-muted-foreground">
            Les prix et disponibilites affiches ici sont ceux du dernier ajout au panier. La verification finale sera refaite au moment de la creation de commande.
          </p>
        </div>

        <div className="space-y-4">
          {items.map((item) => {
            const validation = validateCartItem(item)
            const availability = getProductAvailability(item.product)
            const unitPrice = getCartItemUnitPrice(item)
            const lineTotal = getCartItemLineTotal(item)

            return (
              <Card key={item.product.id} className="overflow-hidden border-border/60">
                <CardContent className="grid gap-5 p-5 md:grid-cols-[10rem_1fr]">
                  <ProductVisual
                    name={item.product.name}
                    imageUrl={getProductPrimaryImage(item.product)}
                    className="h-40"
                  />

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{item.product.category}</Badge>
                        <Badge variant={availability.variant}>{availability.label}</Badge>
                      </div>
                      <div>
                        <Link
                          href={`/products/${item.product.id}`}
                          className="font-serif text-2xl font-semibold transition-colors hover:text-primary"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {item.product.description ?? 'Description a completer depuis le back-office.'}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 text-sm md:grid-cols-3">
                      <div>
                        <p className="text-muted-foreground">Prix unitaire</p>
                        <p className="mt-1 font-medium">{formatGNF(unitPrice)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Unite</p>
                        <p className="mt-1 font-medium">{item.product.unit}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total ligne</p>
                        <p className="mt-1 font-semibold">{formatGNF(lineTotal)}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          disabled={item.quantity <= 1}
                          onClick={() => {
                            const result = updateQuantity(item.product.id, item.quantity - 1)

                            if (!result.success) {
                              toast({
                                title: 'Quantite non modifiee',
                                description: result.message,
                                variant: 'destructive',
                              })
                            }
                          }}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <div className="min-w-16 rounded-full border border-border/70 px-4 py-2 text-center text-sm font-medium">
                          {item.quantity}
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => {
                            const result = updateQuantity(
                              item.product.id,
                              clampCartQuantity(item.quantity + 1)
                            )

                            if (result.message !== 'Quantite mise a jour.') {
                              toast({
                                title: result.success
                                  ? 'Panier ajuste'
                                  : 'Quantite non modifiee',
                                description: result.message,
                                variant: result.success ? 'default' : 'destructive',
                              })
                            }
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          removeItem(item.product.id)
                          toast({
                            title: 'Produit retire',
                            description: `${item.product.name} a ete retire du panier.`,
                          })
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Supprimer
                      </Button>
                    </div>

                    {validation.status !== 'valid' ? (
                      <p
                        className={`text-sm ${
                          validation.status === 'invalid'
                            ? 'text-destructive'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {validation.message}
                      </p>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/products">Continuer mes achats</Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              clearCart()
              toast({
                title: 'Panier vide',
                description: 'Tous les produits ont ete retires du panier.',
              })
            }}
          >
            Vider le panier
          </Button>
        </div>
      </section>

      <CartSidebar
        lineCount={summary.lineCount}
        totalQuantity={summary.totalQuantity}
        subtotal={summary.subtotal}
        invalidLineCount={summary.invalidLineCount}
        canCheckout={canCheckout}
        helperText={
          canCheckout
            ? 'Votre panier est coherent pour passer a l etape checkout.'
            : 'Corrigez les lignes invalides avant de continuer vers le checkout.'
        }
      />
    </main>
  )
}
