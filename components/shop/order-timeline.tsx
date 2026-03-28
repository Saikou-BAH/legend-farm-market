import { CheckCircle2, Circle } from 'lucide-react'
import { getOrderStatusLabel } from '@/lib/order-display'
import type { OrderStatus } from '@/types'

const steps: Array<{ key: OrderStatus; label: string }> = [
  { key: 'pending', label: 'Commande recue' },
  { key: 'confirmed', label: 'Confirmee' },
  { key: 'preparing', label: 'Preparation' },
  { key: 'out_for_delivery', label: 'En livraison' },
  { key: 'delivered', label: 'Livree' },
]

interface OrderTimelineProps {
  status: OrderStatus
}

export function OrderTimeline({ status }: OrderTimelineProps) {
  if (status === 'cancelled' || status === 'returned') {
    return (
      <div className="rounded-[1.25rem] border border-border/70 bg-muted/20 p-4 text-sm">
        <p className="font-medium">{getOrderStatusLabel(status)}</p>
        <p className="mt-1 text-muted-foreground">
          Cette commande a quitte le cycle normal de preparation et de livraison.
        </p>
      </div>
    )
  }

  const currentIndex = steps.findIndex((step) => step.key === status)

  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const done = currentIndex >= index
        const Icon = done ? CheckCircle2 : Circle

        return (
          <div key={step.key} className="flex items-center gap-3">
            <Icon className={done ? 'h-4 w-4 text-primary' : 'h-4 w-4 text-muted-foreground'} />
            <p className={done ? 'font-medium text-foreground' : 'text-muted-foreground'}>
              {step.label}
            </p>
          </div>
        )
      })}
    </div>
  )
}
