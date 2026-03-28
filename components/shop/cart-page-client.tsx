'use client'

import Link from 'next/link'
import { ArrowRight, Minus, Plus, ShieldCheck, Sparkles, Trash2, Truck } from 'lucide-react'
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
      <main className="pb-20">
        <section className="container pt-8 md:pt-12">
          <div className="surface-panel rounded-[2.3rem] px-6 py-8 md:px-10">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <section className="space-y-5">
                <div className="space-y-2">
                  <Badge variant="secondary">Panier intelligent</Badge>
                  <h1 className="font-serif text-4xl md:text-5xl">Chargement de votre panier</h1>
                  <p className="text-lg leading-8 text-muted-foreground">
                    Nous relisons les produits que vous avez deja prepares pour reconstruire un recap propre et coherent.
                  </p>
                </div>
                <Card className="border-dashed border-border/70 bg-white/60">
                  <CardContent className="p-6 text-sm text-muted-foreground">
                    Le panier sera disponible des que les donnees locales seront relues.
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
            </div>
          </div>
        </section>
      </main>
    )
  }

  if (items.length === 0) {
    return (
      <main className="pb-20">
        <section className="container pt-8 md:pt-12">
          <div className="surface-panel rounded-[2.3rem] px-6 py-8 md:px-10">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <section className="space-y-5">
                <div className="space-y-2">
                  <Badge variant="secondary">Panier intelligent</Badge>
                  <h1 className="font-serif text-4xl md:text-5xl">Panier encore vide</h1>
                  <p className="text-lg leading-8 text-muted-foreground">
                    Votre panier sauvegarde les produits ajoutes depuis la boutique pour construire une commande plus rapidement.
                  </p>
                </div>

                <EmptyState
                  title="Commencez par une selection propre"
                  description="Ajoutez vos premiers produits depuis le catalogue pour preparer une commande."
                />

                <Button asChild>
                  <Link href="/products">
                    Explorer le catalogue
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </section>

              <CartSidebar
                lineCount={0}
                totalQuantity={0}
                subtotal={0}
                canCheckout={false}
                helperText="Ajoutez au moins un produit pour preparer votre checkout."
              />
            </div>
          </div>
        </section>
      </main>
    )
  }

  const canCheckout = summary.invalidLineCount === 0

  return (
    <main className="pb-20">
      <section className="container pt-8 md:pt-12">
        <div className="surface-panel section-grid rounded-[2.3rem] px-6 py-8 md:px-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="space-y-6">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">Panier intelligent</Badge>
                  <Badge variant="outline">{summary.totalQuantity} article(s)</Badge>
                </div>
                <div className="space-y-3">
                  <h1 className="font-serif text-4xl md:text-5xl">Votre panier est pret a devenir une commande</h1>
                  <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
                    Une lecture claire, des prix visibles et une validation finale cote serveur pour garder une experience de commande rassurante.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-white/72">
                  <CardContent className="p-5">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Articles
                    </p>
                    <p className="mt-2 font-serif text-3xl">{summary.totalQuantity}</p>
                  </CardContent>
                </Card>
                <Card className="bg-white/72">
                  <CardContent className="p-5">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Lignes
                    </p>
                    <p className="mt-2 font-serif text-3xl">{summary.lineCount}</p>
                  </CardContent>
                </Card>
                <Card className="bg-white/72">
                  <CardContent className="p-5">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Sous-total
                    </p>
                    <p className="mt-2 font-serif text-3xl">{formatGNF(summary.subtotal)}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-white/72">
                  <CardContent className="flex gap-3 p-5 text-sm">
                    <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                    <p className="leading-6 text-muted-foreground">
                      Les prix et la disponibilite sont reverifies avant creation de commande.
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-white/72">
                  <CardContent className="flex gap-3 p-5 text-sm">
                    <Truck className="mt-0.5 h-4 w-4 text-primary" />
                    <p className="leading-6 text-muted-foreground">
                      Livraison locale ou retrait ferme selon votre configuration.
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-white/72">
                  <CardContent className="flex gap-3 p-5 text-sm">
                    <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
                    <p className="leading-6 text-muted-foreground">
                      Parcours plus propre, plus lisible et plus vendeur de la selection au checkout.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                {items.map((item) => {
                  const validation = validateCartItem(item)
                  const availability = getProductAvailability(item.product)
                  const unitPrice = getCartItemUnitPrice(item)
                  const lineTotal = getCartItemLineTotal(item)

                  return (
                    <Card
                      key={item.product.id}
                      className="surface-panel overflow-hidden border-white/80"
                    >
                      <CardContent className="grid gap-5 p-5 md:grid-cols-[11rem_1fr]">
                        <ProductVisual
                          name={item.product.name}
                          imageUrl={getProductPrimaryImage(item.product)}
                          className="h-44"
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
                              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                {item.product.description ?? 'Description a completer depuis le back-office.'}
                              </p>
                            </div>
                          </div>

                          <div className="grid gap-3 md:grid-cols-3">
                            <div className="rounded-[1.2rem] border border-border/70 bg-white/70 p-4 text-sm">
                              <p className="text-muted-foreground">Prix unitaire</p>
                              <p className="mt-1 font-medium">{formatGNF(unitPrice)}</p>
                            </div>
                            <div className="rounded-[1.2rem] border border-border/70 bg-white/70 p-4 text-sm">
                              <p className="text-muted-foreground">Unite</p>
                              <p className="mt-1 font-medium">{item.product.unit}</p>
                            </div>
                            <div className="rounded-[1.2rem] border border-border/70 bg-white/70 p-4 text-sm">
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
                                aria-label={`Reduire la quantite de ${item.product.name}`}
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
                              <div className="min-w-20 rounded-full border border-border/70 bg-white/80 px-4 py-2 text-center text-sm font-semibold shadow-[0_10px_24px_rgba(22,54,36,0.05)]">
                                {item.quantity}
                              </div>
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                aria-label={`Augmenter la quantite de ${item.product.name}`}
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
          </div>
        </div>
      </section>
    </main>
  )
}
