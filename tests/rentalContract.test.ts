import { beforeAll, describe, expect, it } from 'vitest'
import type { Offer, QuoteDetail, Vehicle } from '../app/types'

beforeAll(() => {
  (globalThis as any).createError = (opts: any) => Object.assign(new Error(opts.statusMessage), opts)
})

const vehicle = (id: string, kind: Vehicle['kind'], plates?: string[], fuel: 'diesel' | 'petrol' = 'diesel'): Vehicle => ({
  id, slug: id, category: 'support-vehicles', kind, name: { en: `Vehicle ${id}`, is: '' }, tagline: { en: '', is: '' },
  description: { en: '', is: '' }, highlights: [], specs: { fuel }, images: ['/x.jpg'], featured: false, plates,
})

const quote: QuoteDetail = {
  id: 'q-1', createdAt: '2026-08-01T00:00:00Z', status: 'offered', source: 'admin', locale: 'en',
  name: 'Anna Björk', email: 'anna@example.com', phone: '+354 699 1234', company: 'Norðurljós ehf.', kennitala: '520199-2130',
  dates: '12.–18. ágúst 2026',
  items: [
    { id: 1, itemType: 'vehicle', itemId: 'van', name: { en: 'Cargo Van', is: 'Sendibíll' }, qty: 2 },
    { id: 2, itemType: 'vehicle', itemId: 'pickup', name: { en: 'Pickup', is: 'Pallbíll' }, qty: 1 },
    { id: 3, itemType: 'equipment', itemId: 'heater', name: { en: 'Heater', is: 'Hitari' }, qty: 2 },
  ],
  offers: [],
}

const offer: Offer = {
  id: 7, quoteId: 'q-1', createdAt: '2026-08-02T00:00:00Z', currency: 'ISK', vatRate: 24,
  discountType: 'percent', discountValue: 10,
  items: [
    { quoteItemId: 1, itemType: 'vehicle', itemId: 'van', name: { en: 'Cargo Van', is: '' }, qty: 2, unitPrice: 20000, pricing: 'day', days: 7, lineTotal: 280000,
      extras: [{ kind: 'insurance', tier: 'gold', qty: 2, unitPrice: 3000, total: 42000 }, { kind: 'driver', unlimited: true, qty: 2, unitPrice: 1000, total: 14000 }] },
    { quoteItemId: 2, itemType: 'vehicle', itemId: 'pickup', name: { en: 'Pickup', is: '' }, qty: 1, unitPrice: 30000, pricing: 'day', days: 7, lineTotal: 210000 },
    { quoteItemId: 3, itemType: 'equipment', itemId: 'heater', name: { en: 'Heater', is: '' }, qty: 2, unitPrice: 4000, pricing: 'flat', lineTotal: 8000 },
  ],
  // net 498,600 → VAT 119,664 → total 618,264
  subtotal: 554000, discountAmount: 55400, vatAmount: 119664, total: 618264,
}

describe('splitDates', async () => {
  const { splitDates } = await import('../server/utils/rentalContractStore')

  it('splits an Icelandic day range and borrows the month', () => {
    expect(splitDates('12.–18. ágúst 2026')).toEqual({ pickup: '12. ágúst 2026', return: '18. ágúst 2026' })
  })
  it('splits full dates around a dash or "to"', () => {
    expect(splitDates('12 Aug 2026 09:00 - 18 Aug 2026 17:00')).toEqual({ pickup: '12 Aug 2026 09:00', return: '18 Aug 2026 17:00' })
    expect(splitDates('1 October 2026 to 5 October 2026')).toEqual({ pickup: '1 October 2026', return: '5 October 2026' })
  })
  it('keeps unsplittable text in pickup', () => {
    expect(splitDates('October')).toEqual({ pickup: 'October', return: '' })
    expect(splitDates(undefined)).toEqual({ pickup: '', return: '' })
  })
})

describe('buildContractData', async () => {
  const { buildContractData } = await import('../server/utils/rentalContractStore')
  const fleet = [vehicle('van', 'cargo-van', ['AB123', 'CD456']), vehicle('pickup', 'pickup', ['PK001'], 'petrol')]

  it('expands vehicle lines into one row per unit with plates, fuel and annex kind', () => {
    const data = buildContractData(quote, offer, fleet)
    expect(data.vehicles.map(v => [v.makeModel, v.regNo, v.fuel, v.annexKind])).toEqual([
      ['Cargo Van', 'AB123', 'diesel', 'van'],
      ['Cargo Van', 'CD456', 'diesel', 'van'],
      ['Pickup', 'PK001', 'petrol', 'pickup'],
    ])
    expect(data.vehicles[0]!.pickupAt).toBe('12. ágúst 2026')
    expect(data.vehicles[0]!.returnAt).toBe('18. ágúst 2026')
  })

  it('prints charges incl. VAT with the discount spread so the lines add up to the offer total', () => {
    const data = buildContractData(quote, offer, fleet)
    const c = data.charges
    expect(data.currency).toBe('ISK')
    expect(c.rentalDays).toBe(7)
    expect(c.total).toBe(618264)
    expect((c.rental ?? 0) + (c.insurance ?? 0) + (c.extras ?? 0)).toBe(618264)
    expect(c.extrasText).toContain('Unlimited drivers')
    expect(c.extrasText).toContain('2× Heater')
    // 20000 × 0.9 × 1.24
    expect(data.vehicles[0]!.ratePerDay).toBe(22320)
  })

  it('copies the renter from the quote', () => {
    const data = buildContractData(quote, offer, fleet)
    expect(data.renter.name).toBe('Anna Björk · Norðurljós ehf.')
    expect(data.renter.idNo).toBe('520199-2130')
    expect(data.renter.email).toBe('anna@example.com')
  })

  it('works without an offer, straight from the quote items', () => {
    const data = buildContractData(quote, null, fleet)
    expect(data.vehicles).toHaveLength(3)
    expect(data.charges.total).toBeNull()
  })
})

describe('parseContractData', async () => {
  const { parseContractData } = await import('../server/utils/rentalContractStore')

  it('normalises an arbitrary body without throwing', () => {
    const data = parseContractData({
      template: 'bogus', agreementDate: 'not a date', renter: { name: '  Jón  ' },
      drivers: [{ name: 'A' }, {}], vehicles: [{ regNo: 'ab12', fuel: 'hydrogen', ratePerDay: '1200.5', annexKind: 'x' }],
      currency: 'USD', vatRate: 'abc', charges: { total: '10' }, paymentMethod: 'cash',
    })
    expect(data.template).toBe('auto')
    expect(data.agreementDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(data.renter.name).toBe('Jón')
    expect(data.drivers).toHaveLength(1)
    expect(data.vehicles[0]).toMatchObject({ regNo: 'AB12', fuel: '', ratePerDay: 1200.5, annexKind: 'generic' })
    expect(data.currency).toBe('ISK')
    expect(data.vatRate).toBe(24)
    expect(data.charges.total).toBe(10)
    expect(data.paymentMethod).toBe('')
  })
})
