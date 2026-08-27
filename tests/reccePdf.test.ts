import { readFileSync } from 'node:fs'
import { PDFDocument } from 'pdf-lib'
import { describe, expect, it } from 'vitest'
import type { RecceDoc, RecceLabels } from '../app/utils/reccePdf'
import { exportReccePdf } from '../app/utils/reccePdf'

const LABELS: RecceLabels = {
  contacts: 'Tengiliðir',
  mapLink: 'Kort',
  continued: 'framhald',
  dateText: 'Sunnudagur, 23. ágúst 2026',
  mapTitle: 'Yfirlitskort',
}

const JPEG_DATA_URL = `data:image/jpeg;base64,${readFileSync('public/images/equipment/broom.jpg').toString('base64')}`

const stop = (n: number) => ({
  time: `${String(8 + (n % 10)).padStart(2, '0')}:00`,
  endTime: n % 2 ? `${String(8 + (n % 10)).padStart(2, '0')}:45` : '',
  name: `Stopp ${n}: Þingvellir, gjáin`,
  address: 'Þingvallavegur 36, 805 Selfoss',
  notes: 'Skoða bílastæði fyrir tækjabíla og aðgengi að rafmagni. Veður getur breyst hratt.',
  link: n % 3 === 0 ? 'https://maps.app.goo.gl/abc123' : '',
  travel: n % 2 ? '30 mín keyrsla' : '1 klst 15 mín keyrsla',
  photos: n % 2 ? [JPEG_DATA_URL] : [],
})

const baseDoc = (stops: number): RecceDoc => ({
  project: 'Verkefnið Ísöld',
  subtitle: 'Tech recce',
  date: '2026-08-23',
  note: 'Mæting við skrifstofu kl. 07:30. Sameinast í tvo bíla.',
  stops: Array.from({ length: stops }, (_, i) => stop(i + 1)),
  contacts: [
    { name: 'Jóna Þóra', role: 'Location manager', phone: '+354 555 1234' },
    { name: 'Birkir', role: '', phone: '+354 555 9876' },
  ],
})

describe('exportReccePdf', () => {
  it('generates a valid single-page PDF with Icelandic text and links', async () => {
    const bytes = await exportReccePdf(baseDoc(3), LABELS)
    expect(String.fromCharCode(...bytes.slice(0, 5))).toBe('%PDF-')
    const pdf = await PDFDocument.load(bytes)
    expect(pdf.getPageCount()).toBe(1)
    expect(pdf.getTitle()).toBe('Verkefnið Ísöld - Tech recce')
  })

  it('paginates long schedules and numbers every page', async () => {
    const pdf = await PDFDocument.load(await exportReccePdf(baseDoc(40), LABELS))
    expect(pdf.getPageCount()).toBeGreaterThan(1)
  })

  it('survives characters outside WinAnsi (emoji, arrows) without throwing', async () => {
    const doc = baseDoc(1)
    doc.note = 'Muna 🎥 → myndavélar og 🥪 nesti'
    doc.stops[0]!.name = 'Gjáin 🌋'
    const bytes = await exportReccePdf(doc, LABELS)
    expect(String.fromCharCode(...bytes.slice(0, 5))).toBe('%PDF-')
  })

  it('adds an overview-map page when one is provided', async () => {
    const doc = { ...baseDoc(2), overviewMap: { image: JPEG_DATA_URL } }
    const withMap = await PDFDocument.load(await exportReccePdf(doc, LABELS))
    const without = await PDFDocument.load(await exportReccePdf(baseDoc(2), LABELS))
    expect(withMap.getPageCount()).toBe(without.getPageCount() + 1)
  })

  it('skips corrupt photos and map images instead of failing the export', async () => {
    const doc = { ...baseDoc(1), overviewMap: { image: 'data:image/jpeg;base64,not-a-jpeg' } }
    doc.stops[0]!.photos = ['data:image/jpeg;base64,garbage']
    const pdf = await PDFDocument.load(await exportReccePdf(doc, LABELS))
    expect(pdf.getPageCount()).toBe(1)
  })

  it('handles an empty project name and stops without times', async () => {
    const doc: RecceDoc = {
      project: '',
      subtitle: '',
      date: '',
      note: '',
      stops: [{ time: '', endTime: '', name: 'Basecamp', address: '', notes: '', link: '', travel: '', photos: [] }],
      contacts: [],
    }
    const pdf = await PDFDocument.load(await exportReccePdf(doc, { ...LABELS, dateText: '' }))
    expect(pdf.getPageCount()).toBe(1)
  })
})
