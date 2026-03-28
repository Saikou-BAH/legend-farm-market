import test from 'node:test'
import assert from 'node:assert/strict'
import { getEarnedPoints, getRedeemableAmount } from '../lib/utils/points.ts'

test('getEarnedPoints arrondit a l entier inferieur', () => {
  assert.equal(getEarnedPoints(1234.9, 0.5), 617)
})

test('getEarnedPoints ne renvoie jamais un negatif', () => {
  assert.equal(getEarnedPoints(-500, 1), 0)
})

test('getRedeemableAmount convertit les points en montant', () => {
  assert.equal(getRedeemableAmount(300, 10), 3000)
})
