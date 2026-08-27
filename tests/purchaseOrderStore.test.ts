import { beforeAll, describe, expect, it } from 'vitest'

beforeAll(() => {
  (globalThis as any).useRuntimeConfig = () => ({});
  (globalThis as any).createError = (opts: any) => Object.assign(new Error(opts.statusMessage), opts)
})

describe('validateVendor', () => {
  it('trims and accepts a normal vendor', async () => {
    const { validateVendor } = await import('../server/utils/purchaseOrderStore')
    expect(validateVendor('  Byko ')).toBe('Byko')
  })

  it('rejects empty and non-string vendors', async () => {
    const { validateVendor } = await import('../server/utils/purchaseOrderStore')
    expect(() => validateVendor('')).toThrow()
    expect(() => validateVendor('   ')).toThrow()
    expect(() => validateVendor(42)).toThrow()
  })

  it('caps the length at 120 chars', async () => {
    const { validateVendor } = await import('../server/utils/purchaseOrderStore')
    expect(validateVendor('x'.repeat(500))).toHaveLength(120)
  })
})

describe('validateAmount', () => {
  it('accepts whole ISK amounts', async () => {
    const { validateAmount } = await import('../server/utils/purchaseOrderStore')
    expect(validateAmount('12500')).toBe(12500)
    expect(validateAmount(1)).toBe(1)
  })

  it('rejects zero, negatives, decimals and junk', async () => {
    const { validateAmount } = await import('../server/utils/purchaseOrderStore')
    expect(() => validateAmount(0)).toThrow()
    expect(() => validateAmount(-500)).toThrow()
    expect(() => validateAmount(99.5)).toThrow()
    expect(() => validateAmount('abc')).toThrow()
    expect(() => validateAmount(Infinity)).toThrow()
  })

  it('rejects amounts above the cap', async () => {
    const { validateAmount } = await import('../server/utils/purchaseOrderStore')
    expect(() => validateAmount(100_000_001)).toThrow()
    expect(validateAmount(100_000_000)).toBe(100_000_000)
  })
})

describe('validateDescription', () => {
  it('trims, and clears empty to null', async () => {
    const { validateDescription } = await import('../server/utils/purchaseOrderStore')
    expect(validateDescription('  Timbur og skrúfur ')).toBe('Timbur og skrúfur')
    expect(validateDescription('')).toBeNull()
    expect(validateDescription(undefined)).toBeNull()
  })

  it('rejects overlong descriptions', async () => {
    const { validateDescription } = await import('../server/utils/purchaseOrderStore')
    expect(() => validateDescription('x'.repeat(1001))).toThrow()
  })
})

describe('validateDecisionNote', () => {
  it('trims, caps and clears empty to null', async () => {
    const { validateDecisionNote } = await import('../server/utils/purchaseOrderStore')
    expect(validateDecisionNote(' Of dýrt ')).toBe('Of dýrt')
    expect(validateDecisionNote('')).toBeNull()
    expect(validateDecisionNote(undefined)).toBeNull()
    expect(validateDecisionNote('x'.repeat(900))).toHaveLength(500)
  })
})

describe('validateCostCode / validateCostCodeName', () => {
  it('trims and accepts normal values', async () => {
    const { validateCostCode, validateCostCodeName } = await import('../server/utils/purchaseOrderStore')
    expect(validateCostCode(' 4110 ')).toBe('4110')
    expect(validateCostCodeName(' Leikmynd ')).toBe('Leikmynd')
  })

  it('rejects empty values', async () => {
    const { validateCostCode, validateCostCodeName } = await import('../server/utils/purchaseOrderStore')
    expect(() => validateCostCode('')).toThrow()
    expect(() => validateCostCode(undefined)).toThrow()
    expect(() => validateCostCodeName('   ')).toThrow()
  })

  it('caps lengths (20 for the number, 80 for the name)', async () => {
    const { validateCostCode, validateCostCodeName } = await import('../server/utils/purchaseOrderStore')
    expect(validateCostCode('9'.repeat(50))).toHaveLength(20)
    expect(validateCostCodeName('x'.repeat(200))).toHaveLength(80)
  })
})

describe('validateBudget', () => {
  it('accepts whole ISK budgets and clears empty to null', async () => {
    const { validateBudget } = await import('../server/utils/purchaseOrderStore')
    expect(validateBudget('1000000')).toBe(1_000_000)
    expect(validateBudget(500)).toBe(500)
    expect(validateBudget('')).toBeNull()
    expect(validateBudget(undefined)).toBeNull()
    expect(validateBudget(null)).toBeNull()
  })

  it('rejects zero, negatives, decimals and junk', async () => {
    const { validateBudget } = await import('../server/utils/purchaseOrderStore')
    expect(() => validateBudget(0)).toThrow()
    expect(() => validateBudget(-1)).toThrow()
    expect(() => validateBudget(10.5)).toThrow()
    expect(() => validateBudget('abc')).toThrow()
    expect(() => validateBudget(10_000_000_001)).toThrow()
  })
})

describe('validateVatRate', () => {
  it('accepts the Icelandic rates as number or string, empty clears to null', async () => {
    const { validateVatRate } = await import('../server/utils/purchaseOrderStore')
    expect(validateVatRate(24)).toBe(24)
    expect(validateVatRate('11')).toBe(11)
    expect(validateVatRate(0)).toBe(0)
    expect(validateVatRate('0')).toBe(0)
    expect(validateVatRate('')).toBeNull()
    expect(validateVatRate(undefined)).toBeNull()
    expect(validateVatRate(null)).toBeNull()
  })

  it('rejects any other rate', async () => {
    const { validateVatRate } = await import('../server/utils/purchaseOrderStore')
    expect(() => validateVatRate(25)).toThrow()
    expect(() => validateVatRate(-11)).toThrow()
    expect(() => validateVatRate('abc')).toThrow()
    expect(() => validateVatRate(NaN)).toThrow()
  })
})

describe('validateActualAmount', () => {
  it('accepts whole ISK amounts, empty clears to null', async () => {
    const { validateActualAmount } = await import('../server/utils/purchaseOrderStore')
    expect(validateActualAmount('12500')).toBe(12500)
    expect(validateActualAmount(1)).toBe(1)
    expect(validateActualAmount('')).toBeNull()
    expect(validateActualAmount(undefined)).toBeNull()
    expect(validateActualAmount(null)).toBeNull()
  })

  it('rejects zero, negatives, decimals and junk', async () => {
    const { validateActualAmount } = await import('../server/utils/purchaseOrderStore')
    expect(() => validateActualAmount(0)).toThrow()
    expect(() => validateActualAmount(-500)).toThrow()
    expect(() => validateActualAmount(99.5)).toThrow()
    expect(() => validateActualAmount('abc')).toThrow()
    expect(() => validateActualAmount(100_000_001)).toThrow()
  })
})

describe('sniffAttachment', () => {
  it('detects jpeg, png, webp and pdf by content', async () => {
    const { sniffAttachment } = await import('../server/utils/purchaseOrderStore')
    expect(sniffAttachment(Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0, 0]))).toEqual({ ext: 'jpg', mime: 'image/jpeg' })
    expect(sniffAttachment(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A]))).toEqual({ ext: 'png', mime: 'image/png' })
    expect(sniffAttachment(Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP')])))
      .toEqual({ ext: 'webp', mime: 'image/webp' })
    expect(sniffAttachment(Buffer.from('%PDF-1.7 ...'))).toEqual({ ext: 'pdf', mime: 'application/pdf' })
  })

  it('rejects anything else (extension spoofing does not help)', async () => {
    const { sniffAttachment } = await import('../server/utils/purchaseOrderStore')
    expect(sniffAttachment(Buffer.from('<script>alert(1)</script>'))).toBeNull()
    expect(sniffAttachment(Buffer.from('GIF89a'))).toBeNull()
    expect(sniffAttachment(Buffer.alloc(0))).toBeNull()
  })
})

describe('poAttachmentMime', () => {
  it('maps stored extensions to mime types', async () => {
    const { poAttachmentMime } = await import('../server/utils/purchaseOrderStore')
    expect(poAttachmentMime('a.jpg')).toBe('image/jpeg')
    expect(poAttachmentMime('a.png')).toBe('image/png')
    expect(poAttachmentMime('a.webp')).toBe('image/webp')
    expect(poAttachmentMime('a.pdf')).toBe('application/pdf')
  })
})
