import { beforeAll, describe, expect, it } from 'vitest'

beforeAll(() => {
  (globalThis as any).useRuntimeConfig = () => ({});
  (globalThis as any).createError = (opts: any) => Object.assign(new Error(opts.statusMessage), opts)
})

describe('validateAlbumName', () => {
  it('trims and accepts a normal name', async () => {
    const { validateAlbumName } = await import('../server/utils/locationAlbumStore')
    expect(validateAlbumName('  Þingvellir ')).toBe('Þingvellir')
  })

  it('rejects empty and non-string names', async () => {
    const { validateAlbumName } = await import('../server/utils/locationAlbumStore')
    expect(() => validateAlbumName('')).toThrow()
    expect(() => validateAlbumName('   ')).toThrow()
    expect(() => validateAlbumName(42)).toThrow()
  })

  it('caps the length at 120 chars', async () => {
    const { validateAlbumName } = await import('../server/utils/locationAlbumStore')
    expect(validateAlbumName('x'.repeat(500))).toHaveLength(120)
  })
})

describe('validateNote', () => {
  it('trims and clears empty to null', async () => {
    const { validateNote } = await import('../server/utils/locationAlbumStore')
    expect(validateNote('  Hjá bænum ')).toBe('Hjá bænum')
    expect(validateNote('')).toBeNull()
    expect(validateNote(undefined)).toBeNull()
  })

  it('rejects overlong notes', async () => {
    const { validateNote } = await import('../server/utils/locationAlbumStore')
    expect(() => validateNote('x'.repeat(1001))).toThrow()
  })
})

describe('validateCaption', () => {
  it('trims, caps and clears empty to null', async () => {
    const { validateCaption } = await import('../server/utils/locationAlbumStore')
    expect(validateCaption('  Útsýni til norðurs ')).toBe('Útsýni til norðurs')
    expect(validateCaption('')).toBeNull()
    expect(validateCaption(undefined)).toBeNull()
    expect(validateCaption('x'.repeat(900))).toHaveLength(300)
  })
})

describe('validateCoords', () => {
  it('accepts and rounds valid coordinates', async () => {
    const { validateCoords } = await import('../server/utils/locationAlbumStore')
    expect(validateCoords(64.1355, -21.8954)).toEqual({ lat: 64.1355, lng: -21.8954 })
    expect(validateCoords('64.12345678', '-21.98765432')).toEqual({ lat: 64.123457, lng: -21.987654 })
  })

  it('rejects out-of-range or non-numeric coordinates', async () => {
    const { validateCoords } = await import('../server/utils/locationAlbumStore')
    expect(() => validateCoords(91, 0)).toThrow()
    expect(() => validateCoords(-91, 0)).toThrow()
    expect(() => validateCoords(0, 181)).toThrow()
    expect(() => validateCoords(0, -181)).toThrow()
    expect(() => validateCoords('abc', 0)).toThrow()
    expect(() => validateCoords(Infinity, 0)).toThrow()
  })
})

describe('validateColor', () => {
  it('accepts #rrggbb and lowercases it', async () => {
    const { validateColor } = await import('../server/utils/locationAlbumStore')
    expect(validateColor('#E6007E')).toBe('#e6007e')
    expect(validateColor('#2f80ed')).toBe('#2f80ed')
  })

  it('treats empty/null/undefined as clear (null)', async () => {
    const { validateColor } = await import('../server/utils/locationAlbumStore')
    expect(validateColor('')).toBeNull()
    expect(validateColor(null)).toBeNull()
    expect(validateColor(undefined)).toBeNull()
  })

  it('rejects malformed colors', async () => {
    const { validateColor } = await import('../server/utils/locationAlbumStore')
    expect(() => validateColor('red')).toThrow()
    expect(() => validateColor('#fff')).toThrow()
    expect(() => validateColor('#12345g')).toThrow()
    expect(() => validateColor('e6007e')).toThrow()
  })
})

describe('validateRating', () => {
  it('accepts whole numbers 0–5', async () => {
    const { validateRating } = await import('../server/utils/locationAlbumStore')
    expect(validateRating(0)).toBe(0)
    expect(validateRating(3)).toBe(3)
    expect(validateRating(5)).toBe(5)
    expect(validateRating('4')).toBe(4)
  })

  it('rejects out-of-range and non-integers', async () => {
    const { validateRating } = await import('../server/utils/locationAlbumStore')
    expect(() => validateRating(-1)).toThrow()
    expect(() => validateRating(6)).toThrow()
    expect(() => validateRating(2.5)).toThrow()
    expect(() => validateRating('x')).toThrow()
  })
})

describe('sniffImage', () => {
  it('detects jpeg, png and webp by content', async () => {
    const { sniffImage } = await import('../server/utils/locationAlbumStore')
    expect(sniffImage(Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0, 0]))).toEqual({ ext: 'jpg', mime: 'image/jpeg' })
    expect(sniffImage(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A]))).toEqual({ ext: 'png', mime: 'image/png' })
    expect(sniffImage(Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP')])))
      .toEqual({ ext: 'webp', mime: 'image/webp' })
  })

  it('rejects PDFs and anything else (extension spoofing does not help)', async () => {
    const { sniffImage } = await import('../server/utils/locationAlbumStore')
    expect(sniffImage(Buffer.from('%PDF-1.7'))).toBeNull()
    expect(sniffImage(Buffer.from('<script>alert(1)</script>'))).toBeNull()
    expect(sniffImage(Buffer.from('GIF89a'))).toBeNull()
    expect(sniffImage(Buffer.alloc(0))).toBeNull()
  })
})
