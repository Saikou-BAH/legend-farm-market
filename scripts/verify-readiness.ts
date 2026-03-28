import fs from 'node:fs'
import path from 'node:path'

type CheckLevel = 'ok' | 'warn' | 'error'

interface CheckResult {
  level: CheckLevel
  label: string
  detail: string
}

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')

function readEnvFile() {
  const envPath = path.join(rootDir, '.env.local')

  if (!fs.existsSync(envPath)) {
    return ''
  }

  return fs.readFileSync(envPath, 'utf8')
}

function hasEnvValue(rawEnv: string, key: string) {
  return new RegExp(`^${key}=.+$`, 'm').test(rawEnv)
}

function checkEnv(rawEnv: string) {
  const required = [
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ]
  const recommended = [
    'SENTRY_DSN',
    'NEXT_PUBLIC_SENTRY_DSN',
    'SENTRY_ORG',
    'SENTRY_PROJECT',
    'SENTRY_AUTH_TOKEN',
    'BREVO_API_KEY',
    'BREVO_FROM_EMAIL',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'CRON_SECRET',
  ]

  const results: CheckResult[] = []

  for (const key of required) {
    results.push(
      hasEnvValue(rawEnv, key)
        ? {
            level: 'ok',
            label: key,
            detail: 'Variable requise presente.',
          }
        : {
            level: 'error',
            label: key,
            detail: 'Variable requise absente.',
          }
    )
  }

  for (const key of recommended) {
    results.push(
      hasEnvValue(rawEnv, key)
        ? {
            level: 'ok',
            label: key,
            detail: 'Variable recommandee presente.',
          }
        : {
            level: 'warn',
            label: key,
            detail: 'Variable recommandee absente.',
          }
    )
  }

  return results
}

function checkFiles() {
  const requiredFiles = [
    'supabase/migrations/001_shop_foundation.sql',
    'supabase/migrations/002_staff_profiles_phone.sql',
    'supabase/migrations/003_product_media_storage.sql',
    'supabase/migrations/004_payment_transactions.sql',
    'supabase/migrations/005_admin_activity_logs.sql',
    'supabase/migrations/006_loyalty_checkout_settings.sql',
    'docs/ROADMAP_SITE_ECOMMERCE_LEGEND_FARM.md',
    'docs/PREPRODUCTION_CHECKLIST_LEGEND_FARM.md',
    'docs/USER_MANAGEMENT_LEGEND_FARM.md',
    'docs/FINAL_AUDIT_LEGEND_FARM_MARKET_2026-03-28.md',
  ]

  return requiredFiles.map((relativePath) => ({
    level: fs.existsSync(path.join(rootDir, relativePath)) ? ('ok' as const) : ('error' as const),
    label: relativePath,
    detail: fs.existsSync(path.join(rootDir, relativePath))
      ? 'Fichier present.'
      : 'Fichier manquant.',
  }))
}

function printResult(result: CheckResult) {
  const prefix =
    result.level === 'ok' ? '[OK]' : result.level === 'warn' ? '[WARN]' : '[ERROR]'
  console.log(`${prefix} ${result.label} - ${result.detail}`)
}

function main() {
  const rawEnv = readEnvFile()
  const results = [...checkEnv(rawEnv), ...checkFiles()]

  for (const result of results) {
    printResult(result)
  }

  const hasError = results.some((result) => result.level === 'error')
  process.exit(hasError ? 1 : 0)
}

main()
