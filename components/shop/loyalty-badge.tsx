import { Badge } from '@/components/ui/badge'
import type { LoyaltyLevel } from '@/types'

interface LoyaltyBadgeProps {
  level: LoyaltyLevel
}

export function LoyaltyBadge({ level }: LoyaltyBadgeProps) {
  return <Badge variant="secondary">{level}</Badge>
}
