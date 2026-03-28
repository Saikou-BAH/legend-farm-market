export function normalizePhoneForWhatsApp(phone: string | null | undefined) {
  const digits = phone?.replace(/\D+/g, '') ?? ''
  return digits || null
}

export function getWhatsAppHref(
  phone: string | null | undefined,
  message?: string | null
) {
  const normalizedPhone = normalizePhoneForWhatsApp(phone)

  if (!normalizedPhone) {
    return null
  }

  const url = new URL(`https://wa.me/${normalizedPhone}`)

  if (message?.trim()) {
    url.searchParams.set('text', message.trim())
  }

  return url.toString()
}
