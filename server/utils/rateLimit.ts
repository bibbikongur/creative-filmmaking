// Cheap in-memory rate limit — resets on deploy/restart, which is fine for
// low-traffic public forms. Each caller gets its own bucket map.
//
// Expired buckets are swept once the map grows, so a stream of distinct keys
// (every bot IP that ever touched a form) cannot grow it without bound.
const SWEEP_ABOVE = 5000

export const makeRateLimiter = (windowMs: number, maxPerWindow: number) => {
  const hits = new Map<string, { count: number, windowStart: number }>()

  return (key: string): boolean => {
    const now = Date.now()
    if (hits.size > SWEEP_ABOVE) {
      for (const [k, v] of hits) {
        if (now - v.windowStart > windowMs) hits.delete(k)
      }
    }
    const entry = hits.get(key)
    if (!entry || now - entry.windowStart > windowMs) {
      hits.set(key, { count: 1, windowStart: now })
      return false
    }
    entry.count++
    return entry.count > maxPerWindow
  }
}

// One shared ceiling for the public forms (contact + quote request), across
// ALL callers. The per-IP limits stop one host; this stops a spread-out run
// from burning the mail quota and burying /admin/quotes. Real traffic is a
// handful of submissions a day, so 40 an hour is never reached honestly.
const formsFlooded = makeRateLimiter(60 * 60 * 1000, 40)
export const publicFormsFlooded = () => formsFlooded('all')
