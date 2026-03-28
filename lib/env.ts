function requireEnv(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

export const env = {
  appUrl() {
    return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  },

  hasSupabase() {
    return Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  },

  hasServiceRole() {
    return this.hasSupabase() && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  },

  supabaseUrl() {
    return requireEnv(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL')
  },

  supabaseAnonKey() {
    return requireEnv(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
  },

  supabaseServiceRoleKey() {
    return requireEnv(
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      'SUPABASE_SERVICE_ROLE_KEY'
    )
  },
}
