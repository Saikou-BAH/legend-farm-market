import Link from 'next/link'
import { ArrowRight, ShieldCheck, Sparkles, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatGNF } from '@/lib/utils'

interface CartSidebarProps {
  lineCount: number
  totalQuantity: number
  subtotal: number
  invalidLineCount?: number
  canCheckout?: boolean
  helperText?: string
}

export function CartSidebar({
  lineCount,
  totalQuantity,
  subtotal,
  invalidLineCount = 0,
  canCheckout = true,
  helperText,
}: CartSidebarProps) {
  return (
    <Card className="surface-panel h-fit border-white/80">
      <CardHeader>
        <CardTitle>Resume panier</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <div className="rounded-[1.3rem] border border-border/70 bg-white/72 p-4 text-sm">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Lignes
            </p>
            <p className="mt-2 font-serif text-3xl">{lineCount}</p>
          </div>
          <div className="rounded-[1.3rem] border border-border/70 bg-white/72 p-4 text-sm">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Articles
            </p>
            <p className="mt-2 font-serif text-3xl">{totalQuantity}</p>
          </div>
          <div className="rounded-[1.3rem] border border-border/70 bg-white/72 p-4 text-sm">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Validation
            </p>
            <p className="mt-2 text-sm font-medium">
              {invalidLineCount > 0 ? `${invalidLineCount} a corriger` : 'Panier coherent'}
            </p>
          </div>
        </div>

        <div className="space-y-3 rounded-[1.4rem] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(247,250,243,0.96))] p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Sous-total</span>
            <span className="font-medium">{formatGNF(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-border/60 pt-3 text-base font-semibold">
            <span>Estimation actuelle</span>
            <span>{formatGNF(subtotal)}</span>
          </div>
        </div>

        {helperText ? <p className="text-sm text-muted-foreground">{helperText}</p> : null}
        <div className="grid gap-3 text-sm text-muted-foreground">
          <div className="flex gap-3 rounded-[1.2rem] border border-border/70 bg-white/65 px-4 py-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
            <p>Les prix et disponibilites seront reverifies avant creation de commande.</p>
          </div>
          <div className="flex gap-3 rounded-[1.2rem] border border-border/70 bg-white/65 px-4 py-3">
            <Truck className="mt-0.5 h-4 w-4 text-primary" />
            <p>Livraison locale ou retrait ferme selon la configuration active.</p>
          </div>
          <div className="flex gap-3 rounded-[1.2rem] border border-border/70 bg-white/65 px-4 py-3">
            <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
            <p>Une experience plus claire pour acheter vite et sans surprise.</p>
          </div>
        </div>
        {canCheckout ? (
          <Button asChild className="w-full">
            <Link href="/checkout">
              Passer au checkout
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button className="w-full" disabled>
            Passer au checkout
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
