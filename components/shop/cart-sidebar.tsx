import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CartSidebarProps {
  itemCount: number
}

export function CartSidebar({ itemCount }: CartSidebarProps) {
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Resume panier</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Articles</span>
          <span>{itemCount}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Tarification</span>
          <span>Calculee depuis Supabase</span>
        </div>
        <div className="flex items-center justify-between border-t pt-4 text-sm font-medium">
          <span>Total</span>
          <span>Automatique</span>
        </div>
        <Button asChild className="w-full">
          <Link href="/checkout">
            Passer au checkout
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
