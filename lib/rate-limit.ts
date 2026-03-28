export interface RateLimitOptions {
  key: string
  limit: number
  windowSeconds: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

interface RateLimitEntry {
  count: number
  resetAt: number
}

const memStore = new Map<string, RateLimitEntry>()

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, value] of memStore.entries()) {
      if (value.resetAt < now) {
        memStore.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

function checkMemory(options: RateLimitOptions): RateLimitResult {
  const { key, limit, windowSeconds } = options
  const now = Date.now()
  const windowMs = windowSeconds * 1000
  const existing = memStore.get(key)

  if (!existing || existing.resetAt < now) {
    const entry = { count: 1, resetAt: now + windowMs }
    memStore.set(key, entry)
    return { allowed: true, remaining: limit - 1, resetAt: entry.resetAt }
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt }
  }

  existing.count += 1
  memStore.set(key, existing)

  return {
    allowed: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
  }
}

async function upstashCommand(command: string[]): Promise<unknown> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  const res = await fetch(`${url}/${command.map(encodeURIComponent).join('/')}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  })

  if (!res.ok) return null
  const json = await res.json()
  return json?.result ?? null
}

async function checkRedis(options: RateLimitOptions): Promise<RateLimitResult> {
  const { key, limit, windowSeconds } = options
  const redisKey = `rl:${key}`
  const now = Date.now()
  const resetAt = now + windowSeconds * 1000

  try {
    const count = (await upstashCommand(['INCR', redisKey])) as number | null
    if (count === null) return checkMemory(options)

    if (count === 1) {
      await upstashCommand(['EXPIRE', redisKey, String(windowSeconds)])
    }

    const ttl = (await upstashCommand(['TTL', redisKey])) as number | null
    const actualResetAt = ttl && ttl > 0 ? now + ttl * 1000 : resetAt

    if (count > limit) {
      return { allowed: false, remaining: 0, resetAt: actualResetAt }
    }

    return {
      allowed: true,
      remaining: limit - count,
      resetAt: actualResetAt,
    }
  } catch {
    return checkMemory(options)
  }
}

const useRedis = !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
)

export function checkRateLimit(
  options: RateLimitOptions
): RateLimitResult | Promise<RateLimitResult> {
  if (useRedis) return checkRedis(options)
  return checkMemory(options)
}
