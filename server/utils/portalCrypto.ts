import {
  createCipheriv, createDecipheriv, createHash, randomBytes,
  scryptSync, timingSafeEqual,
} from 'node:crypto'

// ─────────────────────────────────────────────────────────────────────────────
// Crypto for the timesheet portal: scrypt password hashing, AES-256-GCM
// field encryption (day rates), and one-time tokens (invites / password
// resets). Field encryption keys come from NUXT_ENCRYPTION_KEY — losing that
// key makes encrypted columns unrecoverable, so keep it in a password manager.
// ─────────────────────────────────────────────────────────────────────────────

// ── Password hashing (scrypt, self-describing format) ───────────────────────

const SCRYPT_N = 16384
const SCRYPT_R = 8
const SCRYPT_P = 1
const KEY_LEN = 64

export function hashPassword(password: string): string {
  const salt = randomBytes(16)
  const key = scryptSync(password, salt, KEY_LEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P })
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString('base64')}$${key.toString('base64')}`
}

export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (!stored) return false
  const parts = stored.split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false
  const [, n, r, p, saltB64, keyB64] = parts
  try {
    const salt = Buffer.from(saltB64!, 'base64')
    const expected = Buffer.from(keyB64!, 'base64')
    const actual = scryptSync(password, salt, expected.length, {
      N: Number(n), r: Number(r), p: Number(p),
    })
    return timingSafeEqual(actual, expected)
  }
  catch {
    return false
  }
}

/** Burn comparable CPU when the account doesn't exist — no user enumeration via timing. */
const DUMMY_HASH = hashPassword('dummy-password-for-constant-time')
export function verifyAgainstDummy(password: string) {
  verifyPassword(password, DUMMY_HASH)
}

// ── Field encryption (AES-256-GCM) ───────────────────────────────────────────

export const encryptionConfigured = () => Boolean(useRuntimeConfig().encryptionKey)

function encryptionKey(): Buffer {
  const raw = String(useRuntimeConfig().encryptionKey || '')
  if (!raw) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Portal is not configured. Set the NUXT_ENCRYPTION_KEY environment variable.',
    })
  }
  // Accept a 64-char hex key directly; otherwise derive from the passphrase.
  if (/^[0-9a-f]{64}$/i.test(raw)) return Buffer.from(raw, 'hex')
  return createHash('sha256').update(raw).digest()
}

export function encryptField(plain: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv)
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `v1.${iv.toString('base64')}.${tag.toString('base64')}.${ct.toString('base64')}`
}

export function decryptField(enc: string): string {
  const [version, ivB64, tagB64, ctB64] = enc.split('.')
  if (version !== 'v1' || !ivB64 || !tagB64 || !ctB64) {
    throw new Error('Malformed encrypted field')
  }
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivB64, 'base64'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
  return Buffer.concat([decipher.update(Buffer.from(ctB64, 'base64')), decipher.final()]).toString('utf8')
}

// ── One-time tokens (invites / password resets) ──────────────────────────────

const TOKEN_TTL_MS = { invite: 7 * 24 * 60 * 60 * 1000, reset: 2 * 60 * 60 * 1000 } as const

export type TokenPurpose = keyof typeof TOKEN_TTL_MS

export const hashToken = (raw: string) => createHash('sha256').update(raw).digest('hex')

export function makeToken(purpose: TokenPurpose) {
  const token = randomBytes(32).toString('base64url')
  return {
    token,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + TOKEN_TTL_MS[purpose]).toISOString(),
  }
}
