import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import {
  escapeHtml,
  renderEmailLayout,
  renderParagraph,
  renderRichParagraph,
} from '@/lib/email-template'
import { checkRateLimit } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'

function normalizeRequiredText(
  value: string | null | undefined,
  label: string,
  maxLength: number
) {
  const nextValue = value?.trim() ?? ''

  if (!nextValue) {
    throw new Error(`${label} est obligatoire.`)
  }

  return nextValue.slice(0, maxLength)
}

function normalizeOptionalText(value: string | null | undefined, maxLength: number) {
  const nextValue = value?.trim() ?? ''
  return nextValue ? nextValue.slice(0, maxLength) : null
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

async function getShopContactEmail() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('shop_settings')
    .select('value')
    .eq('key', 'shop_email')
    .maybeSingle()

  return typeof data?.value === 'string' && data.value.trim()
    ? data.value.trim()
    : 'contact@legendfarm.gn'
}

export async function POST(request: NextRequest) {
  try {
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ip = forwardedFor?.split(',')[0]?.trim() || 'unknown'
    const rateLimitResult = await checkRateLimit({
      key: `contact:${ip}`,
      limit: 5,
      windowSeconds: 60 * 60,
    })

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Trop de messages ont deja ete envoyes depuis cette adresse.',
        },
        { status: 429 }
      )
    }

    const payload = (await request.json().catch(() => null)) as
      | {
          fullName?: string
          email?: string
          phone?: string
          message?: string
          company?: string
        }
      | null

    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          error: 'Le message est invalide.',
        },
        { status: 400 }
      )
    }

    if (normalizeOptionalText(payload.company, 120)) {
      return NextResponse.json({ success: true })
    }

    const fullName = normalizeRequiredText(payload.fullName, 'Le nom complet', 120)
    const email = normalizeRequiredText(payload.email, "L'email", 160).toLowerCase()
    const message = normalizeRequiredText(payload.message, 'Le message', 4000)
    const phone = normalizeOptionalText(payload.phone, 40)

    if (!isEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "L'adresse email est invalide.",
        },
        { status: 400 }
      )
    }

    const destinationEmail = await getShopContactEmail()

    const result = await sendEmail({
      to: destinationEmail,
      subject: `Nouveau message contact - ${fullName}`,
      html: renderEmailLayout({
        title: 'Nouveau message contact',
        preview: `Message recu de ${fullName}.`,
        bodyHtml: [
          renderRichParagraph(`<strong>Nom :</strong> ${escapeHtml(fullName)}`),
          renderRichParagraph(`<strong>Email :</strong> ${escapeHtml(email)}`),
          renderRichParagraph(
            `<strong>Telephone :</strong> ${escapeHtml(phone ?? 'Non renseigne')}`
          ),
          renderParagraph('Message :'),
          renderRichParagraph(escapeHtml(message).replace(/\n/g, '<br />')),
        ].join(''),
      }),
      text: `Nom: ${fullName}\nEmail: ${email}\nTelephone: ${phone ?? 'Non renseigne'}\n\n${message}`,
      tags: [{ name: 'type', value: 'contact' }],
    })

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            result.error ?? "Le message n'a pas pu etre transmis pour le moment.",
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Une erreur inattendue est survenue.',
      },
      { status: 500 }
    )
  }
}
