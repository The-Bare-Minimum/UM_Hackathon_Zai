const rateLimitCache = new Map<string, { count: number; timestamp: number }>()

export function checkRateLimit(
  identifier: string,
  limit: number = 20, // default 20 requests
  windowMs: number = 3600000 // default 1 hour
): { success: boolean; limit: number; remaining: number } {
  const now = Date.now()
  const record = rateLimitCache.get(identifier)

  if (!record || now - record.timestamp > windowMs) {
    rateLimitCache.set(identifier, { count: 1, timestamp: now })
    return { success: true, limit, remaining: limit - 1 }
  }

  if (record.count >= limit) {
    return { success: false, limit, remaining: 0 }
  }

  record.count += 1
  return { success: true, limit, remaining: limit - record.count }
}
