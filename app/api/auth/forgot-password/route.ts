import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { normalizeEmail, sanitizeInternalPath } from '@/lib/auth'
import { env } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'

function getClientIp(request: NextRequest) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  let email = ''
  let nextPath = '/account/dashboard'

  try {
    const body = await request.json()
    email = normalizeEmail((body.email ?? '').toString())
    nextPath = sanitizeInternalPath((body.next ?? '').toString(), '/account/dashboard')
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Corps de requete invalide.',
      },
      { status: 400 }
    )
  }

  const rlEmail = await checkRateLimit({
    key: `shop-forgot-password:email:${email}`,
    limit: 5,
    windowSeconds: 15 * 60,
  })

  const rlIp = await checkRateLimit({
    key: `shop-forgot-password:ip:${ip}`,
    limit: 20,
    windowSeconds: 15 * 60,
  })

  if (!rlEmail.allowed || !rlIp.allowed) {
    const rl = !rlEmail.allowed ? rlEmail : rlIp
    const retryAfterSec = Math.ceil((rl.resetAt - Date.now()) / 1000)

    return NextResponse.json(
      {
        error: 'Trop de tentatives. Reessayez dans quelques minutes.',
        retryAfter: retryAfterSec,
      },
      { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
    )
  }

  const redirectUrl = new URL('/reset-password', env.appUrl())
  redirectUrl.searchParams.set('next', nextPath)

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl.toString(),
  })

  if (error) {
    return NextResponse.json(
      {
        error: 'Impossible d envoyer le lien de reinitialisation pour le moment.',
      },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
