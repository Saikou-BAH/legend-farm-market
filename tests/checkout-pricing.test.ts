import test from 'node:test'
import assert from 'node:assert/strict'
import { getCheckoutFinancialSummary, resolveCheckoutPromotions } from '../lib/checkout-pricing.ts'
import type { Promotion } from '../types/index.ts'

const basePromotion: Promotion = {
  id: 'promo-1',
  name: 'Promo test',
  description: null,
  type: 'percentage',
  code: 'LFS10',
  value: 10,
  min_order_amount: 0,
  max_uses: null,
  max_uses_per_customer: 1,
  current_uses: 0,
  customer_types: null,
  customer_levels: null,
  product_ids: null,
  zones: null,
  is_active: true,
  is_cumulative: false,
  starts_at: '2025-01-01T00:00:00.000Z',
  ends_at: null,
  created_at: '2025-01-01T00:00:00.000Z',
}

test('resolveCheckoutPromotions applique un code promo manuel valide', () => {
  const result = resolveCheckoutPromotions({
    promotions: [basePromotion],
    promoCode: 'lfs10',
    customerType: 'individual',
    customerLevel: 'bronze',
    zoneName: 'Conakry Centre',
    subtotal: 20000,
    deliveryFee: 3000,
    lines: [{ productId: 'product-1' }],
  })

  assert.equal(result.error, null)
  assert.equal(result.discountAmount, 2000)
  assert.equal(result.selectedPromoCode, 'LFS10')
})

test('getCheckoutFinancialSummary combine promotions, points et credit client', () => {
  const result = getCheckoutFinancialSummary({
    promotions: [basePromotion],
    promoCode: 'LFS10',
    customerType: 'individual',
    customerLevel: 'silver',
    zoneName: 'Conakry Centre',
    subtotal: 50000,
    deliveryFee: 5000,
    lines: [{ productId: 'product-1' }],
    requestedPoints: 3000,
    availablePoints: 10000,
    pointValue: 1,
    useAccountCredit: true,
    availableCreditBalance: 7000,
  })

  assert.equal(result.totalAmount, 50000)
  assert.equal(result.discountAmount, 5000)
  assert.equal(result.pointsUsed, 3000)
  assert.equal(result.pointsPaymentAmount, 3000)
  assert.equal(result.accountCreditApplied, 7000)
  assert.equal(result.remainingPaymentAmount, 40000)
})
