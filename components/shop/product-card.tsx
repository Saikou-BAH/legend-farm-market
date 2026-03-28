import { Egg } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface ProductCardProps {
  name: string
  category: string
  unit: string
  price: number
  description?: string | null
}

export function ProductCard({
  name,
  category,
  unit,
  price,
  description,
}: ProductCardProps) {
  return (
    <Card className="h-full overflow-hidden">
      <div className="flex h-48 items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(215,236,197,0.95),_rgba(255,255,255,0.6))]">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Egg className="h-9 w-9" />
        </div>
      </div>
      <CardContent className="space-y-4 p-6">
        <div className="space-y-3">
          <Badge variant="secondary" className="w-fit">
            {category}
          </Badge>
          <div>
            <h3 className="font-serif text-2xl font-semibold">{name}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {description ?? 'Description a completer depuis le back-office.'}
            </p>
          </div>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">A partir de</p>
            <p className="text-xl font-semibold">{formatCurrency(price)}</p>
            <p className="text-xs text-muted-foreground">par {unit}</p>
          </div>
          <Button size="sm">Ajouter</Button>
        </div>
      </CardContent>
    </Card>
  )
}
