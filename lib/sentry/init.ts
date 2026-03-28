import * as Sentry from '@sentry/nextjs'

let isInitialized = false

export default function initSentry() {
  if (isInitialized) {
    return
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
    enabled: Boolean(process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN),
    tracesSampleRate: 0.1,
    debug: false,
  })

  isInitialized = true
}
