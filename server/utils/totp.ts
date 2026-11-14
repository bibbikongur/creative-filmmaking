import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

// ─────────────────────────────────────────────────────────────────────────────
// Time-based one-time passwords (RFC 6238) for the admin panel's second factor.
// The parameters are the ones every authenticator app assumes: HMAC-SHA1,
// 6 digits, 30 second steps. Pure functions, no Nuxt globals: unit-tested in
// tests/totp.test.ts against the RFC vectors.
// ─────────────────────────────────────────────────────────────────────────────

export const TOTP_PERIOD_S = 30
const DIGITS = 6
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function base32Encode(buf: Uint8Array): string {
  let bits = 0
  let value = 0
  let out = ''
  for (const byte of buf) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31]
  return out
}

export function base32Decode(str: string): Buffer {
  const clean = str.toUpperCase().replace(/[^A-Z2-7]/g, '')
  const bytes: number[] = []
  let bits = 0
  let value = 0
  for (const ch of clean) {
    value = (value << 5) | ALPHABET.indexOf(ch)
    bits += 5
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return Buffer.from(bytes)
}

/** A fresh 160-bit secret, base32 (the form authenticator apps take). */
export const generateTotpSecret = () => base32Encode(randomBytes(20))

export function hotp(secret: Uint8Array, counter: number): string {
  const msg = Buffer.alloc(8)
  msg.writeBigUInt64BE(BigInt(counter))
  const h = createHmac('sha1', secret).update(msg).digest()
  const o = h[19]! & 0xf
  const bin = ((h[o]! & 0x7f) << 24) | (h[o + 1]! << 16) | (h[o + 2]! << 8) | h[o + 3]!
  return String(bin % 10 ** DIGITS).padStart(DIGITS, '0')
}

export const totpStep = (nowMs = Date.now()) => Math.floor(nowMs / 1000 / TOTP_PERIOD_S)

/**
 * Checks a 6-digit code against the secret. Accepts the current step and
 * `window` steps either side (clock drift). Steps at or before `afterStep` are
 * refused, which is what makes a code single-use: the caller stores the
 * returned step and passes it back next time.
 *
 * Returns the matched step, or null.
 */
export function verifyTotp(
  secretBase32: string,
  code: string,
  opts: { nowMs?: number, window?: number, afterStep?: number } = {},
): number | null {
  const supplied = code.replace(/\s/g, '')
  if (!/^\d{6}$/.test(supplied)) return null
  const secret = base32Decode(secretBase32)
  if (secret.length < 10) return null

  const { nowMs = Date.now(), window = 1, afterStep = -1 } = opts
  const current = totpStep(nowMs)
  const suppliedBuf = Buffer.from(supplied)
  let matched: number | null = null
  // No early exit: every candidate is computed and compared in constant time.
  for (let step = current - window; step <= current + window; step++) {
    const ok = timingSafeEqual(Buffer.from(hotp(secret, step)), suppliedBuf)
    if (ok && step > afterStep && matched === null) matched = step
  }
  return matched
}

/** The otpauth:// link an authenticator app reads from the QR code. */
export function totpUri(secretBase32: string, account: string, issuer: string): string {
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(account)}`
  const params = new URLSearchParams({
    secret: secretBase32,
    issuer,
    algorithm: 'SHA1',
    digits: String(DIGITS),
    period: String(TOTP_PERIOD_S),
  })
  return `otpauth://totp/${label}?${params}`
}

// ── Recovery codes ───────────────────────────────────────────────────────────
// One-time fallbacks for a lost phone: 50 random bits each, shown once, stored
// only as SHA-256 hashes.

export const normalizeRecoveryCode = (raw: string) => raw.toUpperCase().replace(/[^A-Z0-9]/g, '')

export const hashRecoveryCode = (raw: string) =>
  createHash('sha256').update(`cf-admin-recovery:${normalizeRecoveryCode(raw)}`).digest('hex')

export function generateRecoveryCodes(count = 8): string[] {
  return Array.from({ length: count }, () => {
    const s = base32Encode(randomBytes(10)).slice(0, 10).toLowerCase()
    return `${s.slice(0, 5)}-${s.slice(5)}`
  })
}
