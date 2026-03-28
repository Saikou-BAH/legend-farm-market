import test from 'node:test'
import assert from 'node:assert/strict'
import { getLineTotal, getTieredUnitPrice } from '../lib/utils/price.ts'

test('getTieredUnitPrice garde le prix de base sous le premier palier', () => {
  assert.equal(
    getTieredUnitPrice({
      basePrice: 1000,
      quantity: 5,
      tiers: [
        { quantity: 10, price: 900 },
        { quantity: 20, price: 800 },
        { quantity: null, price: null },
      ],
    }),
    1000
  )
})

test('getTieredUnitPrice applique le meilleur palier atteint', () => {
  assert.equal(
    getTieredUnitPrice({
      basePrice: 1000,
      quantity: 25,
      tiers: [
        { quantity: 10, price: 950 },
        { quantity: 20, price: 900 },
        { quantity: 50, price: 850 },
      ],
    }),
    900
  )
})

test('getLineTotal calcule correctement le total de ligne', () => {
  assert.equal(getLineTotal(2500, 4), 10000)
})
