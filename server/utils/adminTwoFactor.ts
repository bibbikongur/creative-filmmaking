// ─────────────────────────────────────────────────────────────────────────────
// Two-factor state for the single-password admin panel.
//
// The password stays in NUXT_ADMIN_PASSWORD; the second factor is enrolled from
// the panel itself (/admin/security) and lives in the SQLite `meta` table, so
// turning it on needs no deploy. The TOTP secret is encrypted with
// NUXT_ENCRYPTION_KEY when that is set.
//
// Lost phone and no recovery codes left: set NUXT_ADMIN_TWO_FACTOR_RESET=true
// on the server and restart. That wipes the enrollment (password-only login
// again); remove the variable afterwards to be able to enroll anew.
// ─────────────────────────────────────────────────────────────────────────────

const STATE_KEY = 'admin:2fa'
const PENDING_KEY = 'admin:2fa:pending'
const EPOCH_KEY = 'admin:session-epoch'
const PENDING_TTL_MS = 15 * 60 * 1000

interface TwoFactorState {
  /** Base32 TOTP secret, AES-GCM encrypted ("v1.…") when an encryption key is configured. */
  secret: string
  enabledAt: string
  /** Last accepted time step: codes at or before it are refused (no replay). */
  lastStep: number
  /** SHA-256 hashes of the unused recovery codes. */
  recovery: string[]
}

const getMeta = (key: string): string | null =>
  (getDb().prepare('SELECT value FROM meta WHERE key = ?').get(key) as { value: string } | undefined)?.value ?? null

const setMeta = (key: string, value: string) =>
  getDb().prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, value)

const delMeta = (key: string) => getDb().prepare('DELETE FROM meta WHERE key = ?').run(key)

const sealSecret = (secret: string) => encryptionConfigured() ? encryptField(secret) : secret
const openSecret = (stored: string) => stored.startsWith('v1.') ? decryptField(stored) : stored

export const twoFactorResetRequested = () =>
  ['1', 'true', 'yes'].includes(String(useRuntimeConfig().adminTwoFactorReset || '').toLowerCase())

function readState(): TwoFactorState | null {
  if (twoFactorResetRequested()) {
    if (getMeta(STATE_KEY)) {
      delMeta(STATE_KEY)
      delMeta(PENDING_KEY)
      bumpAdminSessionEpoch()
      console.warn('[admin] two-factor enrollment wiped (NUXT_ADMIN_TWO_FACTOR_RESET is set)')
    }
    return null
  }
  const raw = getMeta(STATE_KEY)
  if (!raw) return null
  try {
    const state = JSON.parse(raw) as TwoFactorState
    return typeof state?.secret === 'string' ? state : null
  }
  catch {
    return null
  }
}

export const adminTwoFactorEnabled = () => readState() !== null

export function adminTwoFactorStatus() {
  const state = readState()
  return {
    enabled: state !== null,
    enabledAt: state?.enabledAt ?? null,
    recoveryCodesLeft: state?.recovery.length ?? 0,
    resetRequested: twoFactorResetRequested(),
  }
}

/**
 * Checks a login-time second factor: a 6-digit authenticator code, or one of
 * the recovery codes. A match is consumed (the time step is remembered, the
 * recovery code is removed), so nothing works twice.
 */
export function consumeAdminSecondFactor(supplied: string): boolean {
  const state = readState()
  if (!state) return false
  const code = String(supplied ?? '').trim()
  if (!code || code.length > 64) return false

  if (/^[\d\s]+$/.test(code)) {
    let secret: string
    try {
      secret = openSecret(state.secret)
    }
    catch {
      // Encryption key changed since enrollment: codes cannot be checked.
      console.error('[admin] two-factor secret cannot be decrypted; use a recovery code or NUXT_ADMIN_TWO_FACTOR_RESET')
      return false
    }
    const step = verifyTotp(secret, code, { afterStep: state.lastStep })
    if (step === null) return false
    setMeta(STATE_KEY, JSON.stringify({ ...state, lastStep: step }))
    return true
  }

  const hash = hashRecoveryCode(code)
  if (!state.recovery.includes(hash)) return false
  setMeta(STATE_KEY, JSON.stringify({ ...state, recovery: state.recovery.filter(h => h !== hash) }))
  return true
}

/** Starts (or restarts) enrollment: a fresh secret that is not active until confirmed. */
export function beginAdminTwoFactorSetup(): string {
  const secret = generateTotpSecret()
  setMeta(PENDING_KEY, JSON.stringify({ secret: sealSecret(secret), createdAt: Date.now() }))
  return secret
}

/**
 * Confirms enrollment with a code from the authenticator app. Returns the
 * recovery codes (the only time they exist in plain text), or null when the
 * code is wrong or the setup has expired.
 */
export function confirmAdminTwoFactorSetup(code: string): string[] | null {
  const raw = getMeta(PENDING_KEY)
  if (!raw) return null
  let pending: { secret: string, createdAt: number }
  try {
    pending = JSON.parse(raw)
  }
  catch {
    return null
  }
  if (!pending?.secret || Date.now() - Number(pending.createdAt) > PENDING_TTL_MS) {
    delMeta(PENDING_KEY)
    return null
  }
  const step = verifyTotp(openSecret(pending.secret), String(code ?? ''))
  if (step === null) return null

  const recovery = generateRecoveryCodes()
  const state: TwoFactorState = {
    secret: pending.secret,
    enabledAt: new Date().toISOString(),
    lastStep: step,
    recovery: recovery.map(hashRecoveryCode),
  }
  setMeta(STATE_KEY, JSON.stringify(state))
  delMeta(PENDING_KEY)
  bumpAdminSessionEpoch()
  return recovery
}

export function disableAdminTwoFactor() {
  delMeta(STATE_KEY)
  delMeta(PENDING_KEY)
  bumpAdminSessionEpoch()
}

// ── Session epoch ────────────────────────────────────────────────────────────
// Stamped into every admin session cookie. Bumping it (2FA switched on or off)
// signs out every other browser: a cookie stolen before 2FA was enabled must
// not keep working after.

export const adminSessionEpoch = () => Number(getMeta(EPOCH_KEY) ?? 0) || 0

export function bumpAdminSessionEpoch() {
  setMeta(EPOCH_KEY, String(adminSessionEpoch() + 1))
}
