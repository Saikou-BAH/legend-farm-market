'use server'

import * as Sentry from '@sentry/nextjs'
import { env } from '@/lib/env'

interface EmailTag {
  name: string
  value: string
}

interface SendEmailInput {
  to: string | string[]
  subject: string
  html: string
  text?: string
  tags?: EmailTag[]
}

interface SendBatchEmailItem extends SendEmailInput {}

interface SendEmailResult {
  success: boolean
  ids: string[]
  error?: string
}

function normalizeRecipients(to: string | string[]) {
  return (Array.isArray(to) ? to : [to])
    .map((recipient) => recipient.trim())
    .filter(Boolean)
    .map((email) => ({ email }))
}

function buildHeaders() {
  return {
    'api-key': env.brevoApiKey(),
    'Content-Type': 'application/json',
    'User-Agent': 'legend-farm-shop/1.0',
  }
}

function buildTags(tags?: EmailTag[]): string[] | undefined {
  if (!tags || tags.length === 0) return undefined
  return tags.map((t) => `${t.name}:${t.value}`)
}

async function handleBrevoResponse(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | { messageId?: string; message?: string; code?: string }
    | null

  if (!response.ok) {
    const errorMessage =
      payload?.message ?? payload?.code ?? `Brevo a retourne HTTP ${response.status}.`

    throw new Error(errorMessage)
  }

  return payload
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  try {
    if (!env.hasBrevo()) {
      return {
        success: false,
        ids: [],
        error: "Les variables Brevo ne sont pas configurees.",
      }
    }

    const recipients = normalizeRecipients(input.to)

    if (recipients.length === 0) {
      return {
        success: false,
        ids: [],
        error: 'Aucun destinataire valide.',
      }
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({
        sender: { name: env.brevoFromName(), email: env.brevoFromEmail() },
        to: recipients,
        subject: input.subject,
        htmlContent: input.html,
        textContent: input.text,
        tags: buildTags(input.tags),
      }),
      cache: 'no-store',
    })

    const payload = await handleBrevoResponse(response)

    return {
      success: true,
      ids: payload?.messageId ? [payload.messageId] : [],
    }
  } catch (error) {
    Sentry.captureException(error)

    return {
      success: false,
      ids: [],
      error:
        error instanceof Error
          ? error.message
          : "Impossible d'envoyer l'email.",
    }
  }
}

export async function sendBatchEmails(
  items: SendBatchEmailItem[]
): Promise<SendEmailResult> {
  try {
    if (!env.hasBrevo()) {
      return {
        success: false,
        ids: [],
        error: "Les variables Brevo ne sont pas configurees.",
      }
    }

    if (items.length === 0) {
      return {
        success: false,
        ids: [],
        error: 'Aucun email a envoyer.',
      }
    }

    const validItems = items
      .map((item) => {
        const recipients = normalizeRecipients(item.to)
        if (recipients.length === 0) return null
        return { ...item, recipients }
      })
      .filter(Boolean) as Array<SendBatchEmailItem & { recipients: { email: string }[] }>

    if (validItems.length === 0) {
      return {
        success: false,
        ids: [],
        error: 'Aucun destinataire valide dans le lot.',
      }
    }

    const results = await Promise.all(
      validItems.map((item) =>
        fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: buildHeaders(),
          body: JSON.stringify({
            sender: { name: env.brevoFromName(), email: env.brevoFromEmail() },
            to: item.recipients,
            subject: item.subject,
            htmlContent: item.html,
            textContent: item.text,
            tags: buildTags(item.tags),
          }),
          cache: 'no-store',
        })
          .then((res) => handleBrevoResponse(res))
          .then((payload) => ({ success: true, id: payload?.messageId ?? null }))
          .catch(() => ({ success: false, id: null }))
      )
    )

    const ids = results.flatMap((r) => (r.success && r.id ? [r.id] : []))
    const allFailed = results.every((r) => !r.success)

    if (allFailed) {
      throw new Error("Tous les envois du lot ont echoue.")
    }

    return {
      success: true,
      ids,
    }
  } catch (error) {
    Sentry.captureException(error)

    return {
      success: false,
      ids: [],
      error:
        error instanceof Error
          ? error.message
          : "Impossible d'envoyer le lot d'emails.",
    }
  }
}
