import { Badge } from '@/components/ui/badge'
import { getOrderStatusLabel } from '@/lib/order-display'
import type { OrderStatus } from '@/types'

interface OrderStatusBadgeProps {
  status: OrderStatus
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const variant =
    status === 'delivered'
      ? 'default'
      : status === 'cancelled' || status === 'returned'
        ? 'outline'
        : 'secondary'

  return <Badge variant={variant}>{getOrderStatusLabel(status)}</Badge>
}
