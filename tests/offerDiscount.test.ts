import { describe, expect, it } from 'vitest'
import type { Offer, OfferItem } from '../app/types'
import { discountedLines } from '../server/utils/offerDiscount'

// Per-line prices after the offer discount, as printed on the offer PDF.

const item = (over: Partial<OfferItem>): OfferItem => ({
  quoteItemId: 1, name: { en: 'Item', is: 'Liður' }, qty: 1, unitPrice: 0, lineTotal: 0, ...over,
})
const offer = (items: OfferItem[], discountAmount: number, currency: Offer['currency'] = 'ISK') => ({
  items,
  currency,
  discountAmount,
  subtotal: items.reduce((sum, i) => sum + i.lineTotal + (i.extras ?? []).reduce((s, e) => s + e.total, 0), 0),
})
const sum = (lines: NonNullable<ReturnType<typeof discountedLines>>) => lines.reduce((s, l) => s + l.groupTotal, 0)

describe('discountedLines', () => {
  it('returns null when the offer has no discount', () => {
    expect(discountedLines(offer([item({ unitPrice: 5000, lineTotal: 5000 })], 0))).toBeNull()
  })

  it('takes a percentage off every rate, line total and add-on', () => {
    const o = offer([
      item({ qty: 2, unitPrice: 20000, pricing: 'day', days: 7, lineTotal: 280000, extras: [
        { kind: 'insurance', tier: 'gold', qty: 2, unitPrice: 3000, total: 42000 },
        { kind: 'km', qty: 400, unitPrice: 45, total: 18000 },
      ] }),
      item({ quoteItemId: 2, qty: 2, unitPrice: 4000, pricing: 'flat', lineTotal: 8000 }),
    ], 34800) // 10% of 348 000
    expect(discountedLines(o)).toEqual([
      { unitPrice: 18000, lineTotal: 252000, groupTotal: 306000, extras: [
        { unitPrice: 2700, total: 37800 },
        // A small rate keeps its decimals instead of rounding to a whole króna.
        { unitPrice: 40.5, total: 16200 },
      ] },
      { unitPrice: 3600, lineTotal: 7200, groupTotal: 7200, extras: [] },
    ])
  })

  it('spreads a fixed discount in proportion and still adds up to the net amount', () => {
    const o = offer([
      item({ unitPrice: 10000, lineTotal: 10000 }),
      item({ quoteItemId: 2, unitPrice: 10000, lineTotal: 10000 }),
      item({ quoteItemId: 3, unitPrice: 10000, lineTotal: 10000 }),
    ], 1000)
    const lines = discountedLines(o)!
    // 29 000 over three equal lines does not divide into whole krónur.
    expect(lines.map(l => l.lineTotal)).toEqual([9667, 9666, 9667])
    expect(sum(lines)).toBe(29000)
  })

  it('rounds euro amounts to cents', () => {
    const o = offer([
      item({ unitPrice: 99.99, pricing: 'day', days: 3, lineTotal: 299.97 }),
      item({ quoteItemId: 2, unitPrice: 45.5, lineTotal: 45.5 }),
    ], 51.82, 'EUR') // 15% of 345.47
    const lines = discountedLines(o)!
    expect(lines[0]!.unitPrice).toBe(84.99)
    expect(Math.round(sum(lines) * 100) / 100).toBe(293.65)
  })
})
