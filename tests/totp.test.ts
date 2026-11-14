import { describe, expect, it } from 'vitest'
import {
  base32Decode, base32Encode, generateRecoveryCodes, generateTotpSecret,
  hashRecoveryCode, hotp, totpStep, totpUri, verifyTotp,
} from '../server/utils/totp'

// RFC 6238 appendix B uses the ASCII secret "12345678901234567890" (SHA-1).
// Its 8-digit vectors, truncated to our 6 digits.
const RFC_SECRET = Buffer.from('12345678901234567890')
const RFC_B32 = base32Encode(RFC_SECRET)

describe('totp', () => {
  it('round-trips base32 and matches the RFC 4648 vector', () => {
    expect(base32Encode(Buffer.from('foobar'))).toBe('MZXW6YTBOI')
    expect(base32Decode('MZXW6YTBOI').toString()).toBe('foobar')
    expect(base32Decode('mzxw 6ytb-oi').toString()).toBe('foobar')
    expect(base32Decode(RFC_B32).equals(RFC_SECRET)).toBe(true)
  })

  it('matches the RFC 6238 SHA-1 vectors', () => {
    expect(hotp(RFC_SECRET, totpStep(59 * 1000))).toBe('287082')
    expect(hotp(RFC_SECRET, totpStep(1111111109 * 1000))).toBe('081804')
    expect(hotp(RFC_SECRET, totpStep(1234567890 * 1000))).toBe('005924')
    expect(hotp(RFC_SECRET, totpStep(20000000000 * 1000))).toBe('353130')
  })

  it('accepts the current step and one either side, nothing further', () => {
    const nowMs = 1111111109 * 1000
    const step = totpStep(nowMs)
    expect(verifyTotp(RFC_B32, '081804', { nowMs })).toBe(step)
    expect(verifyTotp(RFC_B32, '081 804', { nowMs })).toBe(step)
    expect(verifyTotp(RFC_B32, hotp(RFC_SECRET, step - 1), { nowMs })).toBe(step - 1)
    expect(verifyTotp(RFC_B32, hotp(RFC_SECRET, step + 1), { nowMs })).toBe(step + 1)
    expect(verifyTotp(RFC_B32, hotp(RFC_SECRET, step - 2), { nowMs })).toBeNull()
    expect(verifyTotp(RFC_B32, hotp(RFC_SECRET, step + 2), { nowMs })).toBeNull()
  })

  it('refuses a replayed code and malformed input', () => {
    const nowMs = 1111111109 * 1000
    const step = totpStep(nowMs)
    expect(verifyTotp(RFC_B32, '081804', { nowMs, afterStep: step })).toBeNull()
    expect(verifyTotp(RFC_B32, '081804', { nowMs, afterStep: step - 1 })).toBe(step)
    for (const bad of ['', '08180', '0818044', 'abcdef', '081804; DROP']) {
      expect(verifyTotp(RFC_B32, bad, { nowMs })).toBeNull()
    }
    // A too-short secret never verifies, whatever the code.
    expect(verifyTotp('MZXW6', hotp(base32Decode('MZXW6'), step), { nowMs })).toBeNull()
  })

  it('generates 160-bit secrets and a standard otpauth link', () => {
    const secret = generateTotpSecret()
    expect(secret).toMatch(/^[A-Z2-7]{32}$/)
    expect(base32Decode(secret).length).toBe(20)
    expect(generateTotpSecret()).not.toBe(secret)

    const uri = new URL(totpUri(secret, 'admin', 'Creative Filmmaking'))
    expect(uri.protocol).toBe('otpauth:')
    expect(uri.pathname).toContain('Creative%20Filmmaking:admin')
    expect(uri.searchParams.get('secret')).toBe(secret)
    expect(uri.searchParams.get('issuer')).toBe('Creative Filmmaking')
    expect(uri.searchParams.get('digits')).toBe('6')
    expect(uri.searchParams.get('period')).toBe('30')
  })

  it('makes distinct recovery codes whose hash ignores case and dashes', () => {
    const codes = generateRecoveryCodes()
    expect(codes).toHaveLength(8)
    expect(new Set(codes).size).toBe(8)
    for (const c of codes) expect(c).toMatch(/^[a-z2-7]{5}-[a-z2-7]{5}$/)
    const [first] = codes
    expect(hashRecoveryCode(first!.toUpperCase().replace('-', ' '))).toBe(hashRecoveryCode(first!))
    expect(hashRecoveryCode(codes[1]!)).not.toBe(hashRecoveryCode(first!))
  })
})
