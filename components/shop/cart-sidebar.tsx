import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
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
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Resume panier</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Lignes</span>
          <span>{lineCount}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Articles</span>
          <span>{totalQuantity}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Validation</span>
          <span>{invalidLineCount > 0 ? `${invalidLineCount} a corriger` : 'Panier cohérent'}</span>
        </div>
        <div className="flex items-center justify-between border-t pt-4 text-sm font-medium">
          <span>Sous-total</span>
          <span>{formatGNF(subtotal)}</span>
        </div>
        {helperText ? <p className="text-sm text-muted-foreground">{helperText}</p> : null}
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
