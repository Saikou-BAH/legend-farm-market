import test from 'node:test'
import assert from 'node:assert/strict'
import { computePromotionDiscount } from '../lib/utils/promo.ts'

test('computePromotionDiscount gere le pourcentage', () => {
  assert.equal(
    computePromotionDiscount({
      subtotal: 10000,
      type: 'percentage',
      value: 10,
      deliveryFee: 0,
    }),
    1000
  )
})

test('computePromotionDiscount plafonne la remise fixe au sous-total', () => {
  assert.equal(
    computePromotionDiscount({
      subtotal: 5000,
      type: 'fixed_amount',
      value: 8000,
      deliveryFee: 0,
    }),
    5000
  )
})

test('computePromotionDiscount peut annuler les frais de livraison', () => {
  assert.equal(
    computePromotionDiscount({
      subtotal: 12000,
      type: 'free_delivery',
      value: 0,
      deliveryFee: 2500,
    }),
    2500
  )
})
