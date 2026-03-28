import test from 'node:test'
import assert from 'node:assert/strict'
import { getWhatsAppHref, normalizePhoneForWhatsApp } from '../lib/contact.ts'

test('normalizePhoneForWhatsApp retire les caracteres non numeriques', () => {
  assert.equal(normalizePhoneForWhatsApp('+224 620-00-11-22'), '224620001122')
})

test('getWhatsAppHref renvoie null sans numero exploitable', () => {
  assert.equal(getWhatsAppHref(null), null)
  assert.equal(getWhatsAppHref('---'), null)
})

test('getWhatsAppHref genere un lien wa.me avec message encode', () => {
  assert.equal(
    getWhatsAppHref('+224 620 00 11 22', 'Bonjour Legend Farm'),
    'https://wa.me/224620001122?text=Bonjour+Legend+Farm'
  )
})
