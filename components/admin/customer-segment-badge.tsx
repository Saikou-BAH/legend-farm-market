import { Badge } from '@/components/ui/badge'
import type { CustomerType } from '@/types'

interface CustomerSegmentBadgeProps {
  type: CustomerType
}

export function CustomerSegmentBadge({ type }: CustomerSegmentBadgeProps) {
  return <Badge variant="outline">{type}</Badge>
}
