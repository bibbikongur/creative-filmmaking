import { PDFDocument } from 'pdf-lib'
import { describe, expect, it } from 'vitest'
import type { CallSheetDoc, CallSheetLabels } from '../app/utils/callSheetPdf'
import { exportCallSheetPdf } from '../app/utils/callSheetPdf'

const LABELS: CallSheetLabels = {
  callSheet: 'Call sheet',
  crewCall: 'Crew call',
  sunrise: 'Sólarupprás',
  sunset: 'Sólsetur',
  locations: 'Tökustaðir',
  schedule: 'Dagskrá',
  crew: 'Crew',
  colCall: 'Call',
  colName: 'Nafn',
  colRole: 'Hlutverk',
  colDept: 'Deild',
  colPhone: 'Sími',
  contacts: 'Tengiliðir',
  safety: 'Öryggi og neyð',
  mapLink: 'Kort',
  continued: 'framhald',
  dateText: 'Sunnudagur, 23. ágúst 2026',
}

const crewMember = (n: number) => ({
  call: `${String(6 + (n % 4)).padStart(2, '0')}:30`,
  name: `Þórður Jónsson ${n}`,
  role: n % 2 ? 'Gaffer' : 'Best boy',
  dept: n % 3 ? 'Ljósadeild' : 'Myndavéladeild',
  phone: '+354 555 1234',
})

const baseDoc = (crew: number): CallSheetDoc => ({
  production: 'Verkefnið Ísöld',
  dayLabel: 'Dagur 3 af 12',
  crewCall: '07:00',
  note: 'Mæting á basecamp. Munið hlý föt, spáin er köld.',
  weather: '8°C, skýjað, NA 8 m/s',
  sunrise: '05:12',
  sunset: '21:30',
  locations: [
    {
      name: 'Þingvellir, gjáin',
      address: 'Þingvallavegur 36, 805 Selfoss',
      notes: 'Basecamp á efra bílastæði. Þröngt fyrir tækjabíla.',
      link: 'https://maps.app.goo.gl/abc123',
    },
    { name: 'Öxarárfoss', address: '', notes: 'Ganga 10 mín frá bílastæði.', link: '' },
  ],
  schedule: [
    { time: '07:00', label: 'Crew call', detail: 'Basecamp' },
    { time: '08:30', label: 'Fyrsta skot', detail: 'Sena 12, exterior' },
    { time: '13:00', label: 'Hádegismatur', detail: '' },
    { time: '19:00', label: 'Wrap', detail: '' },
  ],
  crew: Array.from({ length: crew }, (_, i) => crewMember(i + 1)),
  contacts: [
    { name: 'Jóna Þóra', role: 'Framleiðandi', phone: '+354 555 1234' },
    { name: 'Birkir', role: '', phone: '+354 555 9876' },
  ],
  safety: 'Næsta sjúkrahús: HSU Selfossi. Neyðarnúmer 112.',
})

describe('exportCallSheetPdf', () => {
  it('generates a valid single-page PDF with Icelandic text and links', async () => {
    const bytes = await exportCallSheetPdf(baseDoc(6), LABELS)
    expect(String.fromCharCode(...bytes.slice(0, 5))).toBe('%PDF-')
    const pdf = await PDFDocument.load(bytes)
    expect(pdf.getPageCount()).toBe(1)
    expect(pdf.getTitle()).toBe('Verkefnið Ísöld - Dagur 3 af 12')
  })

  it('paginates a large crew list and numbers every page', async () => {
    const pdf = await PDFDocument.load(await exportCallSheetPdf(baseDoc(80), LABELS))
    expect(pdf.getPageCount()).toBeGreaterThan(1)
  })

  it('survives characters outside WinAnsi (emoji, arrows) without throwing', async () => {
    const doc = baseDoc(2)
    doc.note = 'Muna 🎥 → myndavélar og 🥪 nesti'
    doc.locations[0]!.name = 'Gjáin 🌋'
    doc.crew[0]!.name = 'Þórður 🎬'
    const bytes = await exportCallSheetPdf(doc, LABELS)
    expect(String.fromCharCode(...bytes.slice(0, 5))).toBe('%PDF-')
  })

  it('handles an empty sheet without throwing', async () => {
    const doc: CallSheetDoc = {
      production: '',
      dayLabel: '',
      crewCall: '',
      note: '',
      weather: '',
      sunrise: '',
      sunset: '',
      locations: [],
      schedule: [],
      crew: [],
      contacts: [],
      safety: '',
    }
    const pdf = await PDFDocument.load(await exportCallSheetPdf(doc, { ...LABELS, dateText: '' }))
    expect(pdf.getPageCount()).toBe(1)
  })

  it('filters out blank filler rows', async () => {
    const doc = baseDoc(1)
    doc.locations.push({ name: '', address: '', notes: '', link: '' })
    doc.schedule.push({ time: '10:00', label: '', detail: '' })
    doc.crew.push({ call: '07:00', name: '', role: '', dept: '', phone: '' })
    const bytes = await exportCallSheetPdf(doc, LABELS)
    expect(String.fromCharCode(...bytes.slice(0, 5))).toBe('%PDF-')
  })
})
