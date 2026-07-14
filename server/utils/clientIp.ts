import type { H3Event } from 'h3'

// ─────────────────────────────────────────────────────────────────────────────
// Trustworthy client IP for rate limiting / brute-force lockout.
//
// A client can freely pre-set the X-Forwarded-For header, so the LEFT-most entry
// (what h3's getRequestIP returns) is attacker-controlled — rotating it defeats
// every per-IP throttle. Our single trusted proxy (Railway's edge) APPENDS the
// real socket IP as the last hop, so the RIGHT-most entry is the one value the
// client cannot forge. We read that instead.
//
// If another trusted proxy is ever placed in front (e.g. Cloudflare), bump
// TRUSTED_HOPS to match, otherwise the proxy's own IP would be trusted as the
// client and everyone would share one bucket.
// ─────────────────────────────────────────────────────────────────────────────

const TRUSTED_HOPS = 1

export function getClientIp(event: H3Event): string {
  const xff = getRequestHeader(event, 'x-forwarded-for')
  if (xff) {
    const parts = xff.split(',').map(p => p.trim()).filter(Boolean)
    if (parts.length) {
      // Count TRUSTED_HOPS in from the right; clamp if the header is shorter
      // than expected (spoofed-short) so we never fall off the left end.
      const ip = parts[Math.max(0, parts.length - TRUSTED_HOPS)]
      if (ip) return ip
    }
  }
  return getRequestIP(event) || event.node.req.socket?.remoteAddress || 'unknown'
}
