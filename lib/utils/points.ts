export function getEarnedPoints(amount: number, rate: number) {
  return Math.max(0, Math.floor(amount * rate))
}

export function getRedeemableAmount(points: number, pointValue: number) {
  return Math.max(0, points * pointValue)
}
