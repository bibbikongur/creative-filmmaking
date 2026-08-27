import { beforeAll, describe, expect, it } from 'vitest'
import type { TemplateField } from '../app/types'

beforeAll(() => {
  (globalThis as any).useRuntimeConfig = () => ({});
  (globalThis as any).createError = (opts: any) => Object.assign(new Error(opts.statusMessage), opts)
})

const VALUES = {
  name: 'Jóna Þóra Jónsdóttir',
  role: 'Gaffer',
  email: 'jona@example.com',
  phone: '+354 555 1234',
  dayRate: 120000,
  sentDate: '2026-08-23',
}

// 1x1 transparent PNG.
const PNG_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

describe('fieldValue', () => {
  it('maps every data field type, with Icelandic day-rate formatting', async () => {
    const { fieldValue } = await import('../server/utils/docSigning')
    expect(fieldValue('name', VALUES, '2026-08-24')).toBe('Jóna Þóra Jónsdóttir')
    expect(fieldValue('role', VALUES, '2026-08-24')).toBe('Gaffer')
    expect(fieldValue('email', VALUES, '2026-08-24')).toBe('jona@example.com')
    expect(fieldValue('phone', VALUES, '2026-08-24')).toBe('+354 555 1234')
    expect(fieldValue('dayRate', VALUES, '2026-08-24')).toBe(`${(120000).toLocaleString('is-IS')} kr.`)
    expect(fieldValue('date', VALUES, '2026-08-24')).toBe('2026-08-23')
    expect(fieldValue('dateSigned', VALUES, '2026-08-24')).toBe('2026-08-24')
  })

  it('returns empty strings for missing optional values', async () => {
    const { fieldValue } = await import('../server/utils/docSigning')
    expect(fieldValue('role', { ...VALUES, role: undefined }, 'x')).toBe('')
    expect(fieldValue('phone', { ...VALUES, phone: undefined }, 'x')).toBe('')
  })
})

describe('stampSignedPdf', () => {
  const makePdf = async () => {
    const { PDFDocument } = await import('pdf-lib')
    const doc = await PDFDocument.create()
    doc.addPage([595, 842]) // A4 in points
    doc.addPage([595, 842])
    return Buffer.from(await doc.save())
  }

  const fields: TemplateField[] = [
    { id: 'a', type: 'name', page: 1, x: 100, y: 150, w: 160, h: 18 },
    { id: 'b', type: 'dayRate', page: 1, x: 100, y: 200, w: 120, h: 18 },
    { id: 'c', type: 'signature', page: 2, x: 100, y: 600, w: 140, h: 40 },
    { id: 'd', type: 'dateSigned', page: 2, x: 300, y: 600, w: 100, h: 18 },
  ]

  it('produces a valid PDF with the signature and audit line embedded', async () => {
    const { stampSignedPdf } = await import('../server/utils/docSigning')
    const pdf = await makePdf()
    const out = await stampSignedPdf({
      pdf,
      fields,
      values: VALUES,
      signaturePng: PNG_DATA_URL,
      signedName: 'Jóna Þóra Jónsdóttir',
      signedAt: new Date('2026-08-23T14:00:00Z'),
      ip: '203.0.113.7',
    })
    expect(out.subarray(0, 5).toString('latin1')).toBe('%PDF-')
    expect(out.length).toBeGreaterThan(pdf.length)

    // Output still parses and keeps its two pages.
    const { PDFDocument } = await import('pdf-lib')
    const reloaded = await PDFDocument.load(out)
    expect(reloaded.getPageCount()).toBe(2)
  })

  it('survives non-WinAnsi characters in names by substituting them', async () => {
    const { stampSignedPdf } = await import('../server/utils/docSigning')
    const out = await stampSignedPdf({
      pdf: await makePdf(),
      fields,
      values: { ...VALUES, name: 'Zoë 日本語' },
      signaturePng: PNG_DATA_URL,
      signedName: '日本語',
      signedAt: new Date(),
      ip: '::1',
    })
    expect(out.subarray(0, 5).toString('latin1')).toBe('%PDF-')
  })

  it('rejects a non-PNG signature payload', async () => {
    const { stampSignedPdf } = await import('../server/utils/docSigning')
    await expect(stampSignedPdf({
      pdf: await makePdf(),
      fields,
      values: VALUES,
      signaturePng: 'data:text/html;base64,PGI+',
      signedName: 'X Y',
      signedAt: new Date(),
      ip: '::1',
    })).rejects.toThrow()
  })
})
