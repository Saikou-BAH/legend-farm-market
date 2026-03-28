import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { readLegendFarmAuthState } from '@/lib/auth'
import { env } from '@/lib/env'

const customerProtectedPrefixes = ['/account', '/orders', '/checkout']
const adminPrefixes = ['/admin']
const forcePasswordAllowedPrefixes = ['/reset-password', '/auth/callback']

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

export async function middleware(request: NextRequest) {
  if (!env.hasSupabase()) {
    return NextResponse.next({
      request,
    })
  }

  let response = NextResponse.next({
    request,
  })

  const supabase = createServerClient(env.supabaseUrl(), env.supabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(
        cookiesToSet: Array<{
          name: string
          value: string
          options?: Parameters<typeof response.cookies.set>[2]
        }>
      ) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })

        response = NextResponse.next({ request })

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const needsCustomerSession = matchesPrefix(pathname, customerProtectedPrefixes)
  const needsAdminSession = matchesPrefix(pathname, adminPrefixes)

  if (!user && (needsCustomerSession || needsAdminSession)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', `${pathname}${request.nextUrl.search}`)
    return NextResponse.redirect(url)
  }

  if (user && !pathname.startsWith('/api/')) {
    const authState = readLegendFarmAuthState(user)

    if (
      authState.forcePasswordChange &&
      !matchesPrefix(pathname, forcePasswordAllowedPrefixes)
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/reset-password'
      url.searchParams.set('reason', 'force_password_change')
      url.searchParams.set('next', `${pathname}${request.nextUrl.search}`)
      return NextResponse.redirect(url)
    }
  }

  if (user && needsAdminSession) {
    const { data: staffProfile } = await supabase
      .from('staff_profiles')
      .select('id, is_active')
      .eq('id', user.id)
      .maybeSingle()

    if (!staffProfile?.is_active) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
