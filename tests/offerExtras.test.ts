import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'

// Vehicle extras (insurance tier, additional drivers, km) on offers: totals
// are computed server-side and the PDF renders them as sub-rows.

beforeAll(async () => {
  const dataDir = mkdtempSync(join(tmpdir(), 'offer-extras-'));
  (globalThis as any).useRuntimeConfig = () => ({
    dataDir,
    public: { contact: { address: 'Reykjavík', phone: '000', email: 'info@example.com' } },
  });
  (globalThis as any).createError = (opts: any) => Object.assign(new Error(opts.statusMessage), opts)
  const db = await import('../server/utils/db');
  (globalThis as any).getDb = db.getDb;
  (globalThis as any).uploadsDir = db.uploadsDir
}, 60_000)

const newQuote = async () => {
  const { createQuote } = await import('../server/utils/quoteStore')
  return createQuote({
    locale: 'is',
    name: 'Jón Jónsson',
    email: 'jon@example.com',
    items: [
      { itemType: 'vehicle', itemId: 'v1', nameEn: 'Land Cruiser', nameIs: 'Land Cruiser', qty: 2 },
      { itemType: 'equipment', itemId: 'e1', nameEn: 'Radio', nameIs: 'Talstöð', qty: 1 },
    ],
  })
}

describe('createOffer with vehicle extras', () => {
  it('prices insurance per vehicle and drivers over the period, km as km × rate', async () => {
    const { createOffer } = await import('../server/utils/quoteStore')
    const quote = await newQuote()
    const [vehicle, radio] = quote.items
    const offer = createOffer(quote.id, {
      currency: 'ISK',
      items: [
        {
          quoteItemId: vehicle!.id,
          unitPrice: 20000,
          pricing: 'day',
          days: 5,
          extras: [
            { kind: 'insurance', tier: 'gold', unitPrice: 3000 },
            { kind: 'driver', qty: 2, unitPrice: 1000 },
            { kind: 'km', qty: 400, unitPrice: 50 },
          ],
        },
        // Extras on non-vehicle items are ignored.
        { quoteItemId: radio!.id, unitPrice: 5000, extras: [{ kind: 'km', qty: 10, unitPrice: 10 }] },
      ],
    })

    const [v, r] = offer.items
    expect(v!.lineTotal).toBe(200000) // 20 000 × 2 × 5
    expect(v!.extras).toEqual([
      { kind: 'insurance', tier: 'gold', qty: 2, unitPrice: 3000, total: 30000 },
      { kind: 'driver', tier: undefined, qty: 2, unitPrice: 1000, total: 10000 },
      { kind: 'km', tier: undefined, qty: 400, unitPrice: 50, total: 20000 },
    ])
    expect(r!.extras).toBeUndefined()
    expect(offer.subtotal).toBe(265000)
    expect(offer.total).toBe(265000 * 1.24)
  })

  it('renders the PDF with extras and a discount', async () => {
    const { createOffer, getQuote } = await import('../server/utils/quoteStore')
    const { generateOfferPdf } = await import('../server/utils/offerPdf')
    const quote = await newQuote()
    const [vehicle, radio] = quote.items
    const offer = createOffer(quote.id, {
      currency: 'ISK',
      discountType: 'percent',
      discountValue: 10,
      items: [
        {
          quoteItemId: vehicle!.id,
          unitPrice: 90000,
          pricing: 'week',
          weeks: 1.5,
          extras: [
            { kind: 'insurance', tier: 'silver', unitPrice: 15000 },
            { kind: 'driver', qty: 1, unitPrice: 7000 },
            { kind: 'km', qty: 1200, unitPrice: 45 },
          ],
        },
        { quoteItemId: radio!.id, unitPrice: 5000 },
      ],
    })
    const pdf = await generateOfferPdf(getQuote(quote.id)!, offer)
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF')
    if (process.env.OFFER_PDF_OUT) (await import('node:fs')).writeFileSync(process.env.OFFER_PDF_OUT, pdf)
  })
})
