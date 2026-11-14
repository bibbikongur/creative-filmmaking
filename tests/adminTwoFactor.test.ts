import Database from 'better-sqlite3'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import * as totp from '../server/utils/totp'

// adminTwoFactor leans on Nuxt auto-imports (getDb, runtime config, the totp
// helpers, field encryption). Stub them on globalThis before importing it.
const config: Record<string, string> = { adminTwoFactorReset: '' }
let db: Database.Database
let mod: typeof import('../server/utils/adminTwoFactor')

beforeAll(async () => {
  const g = globalThis as any
  g.useRuntimeConfig = () => config
  g.getDb = () => db
  g.encryptionConfigured = () => true
  g.encryptField = (s: string) => `v1.${Buffer.from(s).toString('base64')}`
  g.decryptField = (s: string) => Buffer.from(s.slice(3), 'base64').toString()
  Object.assign(g, totp)
  mod = await import('../server/utils/adminTwoFactor')
})

beforeEach(() => {
  db = new Database(':memory:')
  db.exec('CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)')
  config.adminTwoFactorReset = ''
})

const codeNow = (secret: string, offset = 0) =>
  totp.hotp(totp.base32Decode(secret), totp.totpStep() + offset)

const enroll = () => {
  const secret = mod.beginAdminTwoFactorSetup()
  const recovery = mod.confirmAdminTwoFactorSetup(codeNow(secret))!
  return { secret, recovery }
}

describe('admin two-factor', () => {
  it('is off until a setup is confirmed with a valid code', () => {
    expect(mod.adminTwoFactorEnabled()).toBe(false)
    const secret = mod.beginAdminTwoFactorSetup()
    expect(mod.adminTwoFactorEnabled()).toBe(false)
    expect(mod.confirmAdminTwoFactorSetup('000000')).toBeNull()
    expect(mod.adminTwoFactorEnabled()).toBe(false)

    const recovery = mod.confirmAdminTwoFactorSetup(codeNow(secret))
    expect(recovery).toHaveLength(8)
    expect(mod.adminTwoFactorEnabled()).toBe(true)
    expect(mod.adminTwoFactorStatus()).toMatchObject({ enabled: true, recoveryCodesLeft: 8 })
  })

  it('stores the secret encrypted and the recovery codes only as hashes', () => {
    const { secret, recovery } = enroll()
    const raw = (db.prepare('SELECT value FROM meta WHERE key = ?').get('admin:2fa') as { value: string }).value
    expect(raw).not.toContain(secret)
    for (const code of recovery) expect(raw).not.toContain(code)
  })

  it('accepts each authenticator code once', () => {
    const { secret } = enroll()
    // The enrollment code itself is spent.
    expect(mod.consumeAdminSecondFactor(codeNow(secret))).toBe(false)
    const next = codeNow(secret, 1)
    expect(mod.consumeAdminSecondFactor(next)).toBe(true)
    expect(mod.consumeAdminSecondFactor(next)).toBe(false)
    expect(mod.consumeAdminSecondFactor('')).toBe(false)
    expect(mod.consumeAdminSecondFactor('123456')).toBe(false)
  })

  it('accepts each recovery code once, in any letter case', () => {
    const { recovery } = enroll()
    expect(mod.consumeAdminSecondFactor(recovery[0]!.toUpperCase())).toBe(true)
    expect(mod.consumeAdminSecondFactor(recovery[0]!)).toBe(false)
    expect(mod.adminTwoFactorStatus().recoveryCodesLeft).toBe(7)
    expect(mod.consumeAdminSecondFactor('aaaaa-bbbbb')).toBe(false)
  })

  it('bumps the session epoch when switched on and off', () => {
    expect(mod.adminSessionEpoch()).toBe(0)
    enroll()
    expect(mod.adminSessionEpoch()).toBe(1)
    mod.disableAdminTwoFactor()
    expect(mod.adminSessionEpoch()).toBe(2)
    expect(mod.adminTwoFactorEnabled()).toBe(false)
  })

  it('expires an unconfirmed setup after 15 minutes', () => {
    const secret = mod.beginAdminTwoFactorSetup()
    const row = db.prepare('SELECT value FROM meta WHERE key = ?').get('admin:2fa:pending') as { value: string }
    const stale = { ...JSON.parse(row.value), createdAt: Date.now() - 16 * 60 * 1000 }
    db.prepare('UPDATE meta SET value = ? WHERE key = ?').run(JSON.stringify(stale), 'admin:2fa:pending')
    expect(mod.confirmAdminTwoFactorSetup(codeNow(secret))).toBeNull()
    expect(mod.adminTwoFactorEnabled()).toBe(false)
  })

  it('wipes the enrollment when the reset variable is set', () => {
    const { secret } = enroll()
    config.adminTwoFactorReset = 'true'
    expect(mod.adminTwoFactorEnabled()).toBe(false)
    expect(mod.consumeAdminSecondFactor(codeNow(secret, 1))).toBe(false)
    expect(mod.adminTwoFactorStatus().resetRequested).toBe(true)
    // Gone for good: clearing the variable does not bring the old secret back.
    config.adminTwoFactorReset = ''
    expect(mod.adminTwoFactorEnabled()).toBe(false)
    expect(mod.adminSessionEpoch()).toBe(2)
  })
})
