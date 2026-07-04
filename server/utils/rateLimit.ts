// Cheap in-memory rate limit — resets on deploy/restart, which is fine for
// low-traffic public forms. Each caller gets its own bucket map.
export const makeRateLimiter = (windowMs: number, maxPerWindow: number) => {
  const hits = new Map<string, { count: number, windowStart: number }>()

  return (ip: string): boolean => {
    const now = Date.now()
    const entry = hits.get(ip)
    if (!entry || now - entry.windowStart > windowMs) {
      hits.set(ip, { count: 1, windowStart: now })
      return false
    }
    entry.count++
    return entry.count > maxPerWindow
  }
}
