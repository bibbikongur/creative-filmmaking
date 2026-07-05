import { beforeAll, describe, expect, it } from 'vitest'

// portalCrypto reads Nuxt auto-imported globals for field encryption; stub
// them before importing the module.
beforeAll(() => {
  (globalThis as any).useRuntimeConfig = () => ({ encryptionKey: 'test-passphrase-not-hex' });
  (globalThis as any).createError = (opts: any) => Object.assign(new Error(opts.statusMessage), opts)
})

describe('portalCrypto', () => {
  it('hashes and verifies passwords', async () => {
    const { hashPassword, verifyPassword } = await import('../server/utils/portalCrypto')
    const hash = hashPassword('correct horse battery staple')
    expect(hash.startsWith('scrypt$')).toBe(true)
    expect(verifyPassword('correct horse battery staple', hash)).toBe(true)
    expect(verifyPassword('wrong password', hash)).toBe(false)
    expect(verifyPassword('anything', null)).toBe(false)
    expect(verifyPassword('anything', 'garbage')).toBe(false)
  })

  it('encrypts and decrypts fields, and rejects tampering', async () => {
    const { encryptField, decryptField } = await import('../server/utils/portalCrypto')
    const enc = encryptField('120000')
    expect(enc.startsWith('v1.')).toBe(true)
    expect(enc).not.toContain('120000')
    expect(decryptField(enc)).toBe('120000')

    // different IV each time
    expect(encryptField('120000')).not.toBe(enc)

    // flip a ciphertext character → auth tag must fail
    const parts = enc.split('.')
    const ct = parts[3]!
    const tampered = [...parts.slice(0, 3), (ct[0] === 'A' ? 'B' : 'A') + ct.slice(1)].join('.')
    expect(() => decryptField(tampered)).toThrow()
    expect(() => decryptField('v1.garbage')).toThrow()
  })

  it('issues hashed one-time tokens with expiry', async () => {
    const { makeToken, hashToken } = await import('../server/utils/portalCrypto')
    const t = makeToken('invite')
    expect(t.token.length).toBeGreaterThan(30)
    expect(t.tokenHash).toBe(hashToken(t.token))
    expect(new Date(t.expiresAt).getTime()).toBeGreaterThan(Date.now())
  })
})
