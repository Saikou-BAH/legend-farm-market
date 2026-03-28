import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  let email: string
  let password: string

  try {
    const body = await request.json()
    email = (body.email ?? '').toString().toLowerCase().trim()
    password = (body.password ?? '').toString()
  } catch {
    return NextResponse.json(
      { error: 'Corps de requete invalide.' },
      { status: 400 }
    )
  }

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email et mot de passe requis.' },
      { status: 400 }
    )
  }

  const rlEmail = await checkRateLimit({
    key: `shop-login:email:${email}`,
    limit: 8,
    windowSeconds: 15 * 60,
  })

  const rlIp = await checkRateLimit({
    key: `shop-login:ip:${ip}`,
    limit: 25,
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

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return NextResponse.json(
      { error: 'Email ou mot de passe incorrect.' },
      { status: 401 }
    )
  }

  return NextResponse.json({ success: true })
}
