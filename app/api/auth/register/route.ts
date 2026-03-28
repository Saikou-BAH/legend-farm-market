import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'
import {
  getPasswordValidationErrors,
  mergeLegendFarmUserMetadata,
  normalizeEmail,
  normalizeFullName,
  normalizePhone,
} from '@/lib/auth'
import { env } from '@/lib/env'
import { sendWelcomeNotification } from '@/lib/notifications'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function findAuthUserByEmail(email: string) {
  const serviceClient = await createServiceClient()
  let page = 1
  const perPage = 200

  while (true) {
    const { data, error } = await serviceClient.auth.admin.listUsers({ page, perPage })

    if (error) {
      throw new Error(`Impossible de verifier les comptes existants: ${error.message}`)
    }

    const existingUser = data.users.find(
      (user) => (user.email ?? '').trim().toLowerCase() === email
    )

    if (existingUser) {
      return existingUser
    }

    if (data.users.length < perPage) {
      return null
    }

    page += 1
  }
}

function getClientIp(request: NextRequest) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)

  let fullName = ''
  let phone: string | null = null
  let email = ''
  let password = ''

  try {
    const body = await request.json()
    fullName = normalizeFullName((body.fullName ?? '').toString())
    phone = normalizePhone((body.phone ?? '').toString())
    email = normalizeEmail((body.email ?? '').toString())
    password = (body.password ?? '').toString()
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

  const passwordErrors = getPasswordValidationErrors(password)

  if (passwordErrors.length > 0) {
    return NextResponse.json(
      {
        error: `Mot de passe trop faible: ${passwordErrors.join(', ')}.`,
      },
      { status: 400 }
    )
  }

  const rlEmail = await checkRateLimit({
    key: `shop-register:email:${email}`,
    limit: 4,
    windowSeconds: 15 * 60,
  })

  const rlIp = await checkRateLimit({
    key: `shop-register:ip:${ip}`,
    limit: 15,
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

  const existingUser = await findAuthUserByEmail(email)

  if (existingUser) {
    return NextResponse.json(
      { error: 'Un compte existe deja pour cet email.' },
      { status: 409 }
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${env.appUrl()}/auth/callback?next=/account/dashboard`,
      data: mergeLegendFarmUserMetadata(undefined, {
        userType: 'customer',
        forcePasswordChange: false,
      }),
    },
  })

  if (error) {
    return NextResponse.json(
      {
        error: 'Impossible de creer le compte pour le moment.',
      },
      { status: 400 }
    )
  }

  if (!data.user) {
    return NextResponse.json(
      {
        error: 'Supabase n a pas retourne de compte utilisateur.',
      },
      { status: 500 }
    )
  }

  const serviceClient = await createServiceClient()
  const { error: profileError } = await serviceClient.from('customer_profiles').insert({
    id: data.user.id,
    full_name: fullName,
    email,
    phone,
    customer_type: 'individual',
  })

  if (profileError) {
    const rollback = await serviceClient.auth.admin.deleteUser(data.user.id)

    if (rollback.error) {
      return NextResponse.json(
        {
          error:
            'Le compte Auth a ete cree, mais le profil client a echoue et le rollback n a pas abouti. Une verification manuelle est necessaire.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        error: 'Impossible de finaliser la creation du profil client.',
      },
      { status: 500 }
    )
  }

  void sendWelcomeNotification({
    customerEmail: email,
    customerName: fullName,
  })

  return NextResponse.json({
    success: true,
    requiresEmailConfirmation: !data.session,
    next: data.session ? '/account/dashboard' : '/login?registered=1',
  })
}
