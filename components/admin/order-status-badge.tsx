import { Badge } from '@/components/ui/badge'
import type { OrderStatus } from '@/types'

interface OrderStatusBadgeProps {
  status: OrderStatus
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return <Badge variant="secondary">{status}</Badge>
}
