import * as Sentry from '@sentry/nextjs'

export async function register() {
  const { default: initSentry } = await import('@/lib/sentry/init')

  initSentry()
}

export const onRequestError = Sentry.captureRequestError
