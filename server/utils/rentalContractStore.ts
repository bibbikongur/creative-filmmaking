import type {
  ContractAnnexKind, ContractCharges, ContractDriver, ContractFuel, ContractPaymentMethod, ContractPaymentTiming,
  ContractTemplate, ContractVehicle, Offer, OfferCurrency, QuoteDetail, RentalContract, RentalContractData,
  RentalContractSummary, Vehicle,
} from '~~/app/types'

// ─────────────────────────────────────────────────────────────────────────────
// Rental agreements (admin "Contracts"). A contract is created from a quote
// and one of its offers: the offer's vehicle lines become the vehicle rows
// (one per unit, with the registration number picked from the catalogue when
// the listing has exactly one), the renter block comes from the quote and the
// charges from the offer totals. Everything is then editable by hand and the
// saved document is what the PDF prints — see rentalContractPdf.ts.
// ─────────────────────────────────────────────────────────────────────────────

const MAX_TEXT = 200
const MAX_LONG_TEXT = 600
const MAX_ROWS = 40

export const contractNumber = (id: number) => `CF-${String(id).padStart(4, '0')}`

export const emptyDriver = (): ContractDriver => ({ name: '', idNo: '', licenceNo: '', issuingCountry: '', expiry: '', phone: '' })

export const emptyVehicle = (): ContractVehicle => ({
  makeModel: '', regNo: '', fuel: '', pickupAt: '', returnAt: '', kmOut: '', fRoads: false, ratePerDay: null, annexKind: 'generic',
})

const emptyCharges = (): ContractCharges => ({
  rentalDays: null, rentalRate: null, rental: null,
  insuranceDays: null, insuranceRate: null, insurance: null,
  driversCount: null, driversDays: null, driversRate: null,
  extrasText: '', extras: null, total: null,
})

export function emptyContractData(): RentalContractData {
  return {
    template: 'auto',
    agreementDate: new Date().toISOString().slice(0, 10),
    renter: { name: '', idNo: '', phone: '', passportNo: '', address: '', email: '', licenceNo: '', licenceCountryExpiry: '' },
    drivers: [],
    pickupLocation: '',
    returnLocation: '',
    kmUnlimited: true,
    kmPerDay: null,
    vehicles: [],
    currency: 'ISK',
    vatRate: 24,
    charges: emptyCharges(),
    paymentMethod: '',
    paymentRef: '',
    paymentTiming: '',
    existingDamage: '',
    annexA: true,
    photosTaken: false,
    annexB: false,
    annexBContact: '',
    annexBProject: '',
    placeAndDate: '',
    licenceNo: '',
  }
}

/** Annex A diagram for a catalogue vehicle: by its landing-page kind. */
export function annexKindFor(vehicle?: Vehicle): ContractAnnexKind {
  switch (vehicle?.kind) {
    case 'pickup': return 'pickup'
    case 'cargo-van': return 'van'
    case 'box-truck': return 'box'
    default: return 'generic'
  }
}

const fuelFor = (vehicle?: Vehicle): ContractFuel =>
  vehicle?.specs.fuel === 'diesel' ? 'diesel' : vehicle?.specs.fuel === 'petrol' ? 'petrol' : ''

/** Rental days a priced line covers (weeks × 7); undefined for flat prices. */
const lineDays = (item: Offer['items'][number]): number | undefined =>
  item.pricing === 'day' && item.days ? item.days
    : item.pricing === 'week' && item.weeks ? Math.round(item.weeks * 7) : undefined

/**
 * Split the quote's free-text rental period ("12–18 August 2026",
 * "12 Aug - 18 Aug") into pickup and return text. Best effort: anything that
 * doesn't split cleanly lands in pickup for the admin to fix.
 */
export function splitDates(dates?: string): { pickup: string, return: string } {
  const text = (dates ?? '').trim()
  if (!text) return { pickup: '', return: '' }
  const m = /^(.+?)\s*(?:–|—|-|\bto\b|\btil\b)\s*(.+)$/i.exec(text)
  if (!m) return { pickup: text, return: '' }
  const [, a, b] = m
  // "12–18 August 2026": the first half lacks month/year, borrow them.
  const first = a!.trim()
  const second = b!.trim()
  const tail = /^\d{1,2}\.?$/.test(first) ? second.replace(/^\d{1,2}\.?\s*/, '') : ''
  return { pickup: tail ? `${first} ${tail}` : first, return: second }
}

/**
 * Prefill a contract from a quote and (optionally) one of its offers. Amounts
 * are printed incl. VAT in the offer currency, with an offer-level discount
 * spread proportionally so the lines add up to the offer total.
 */
export function buildContractData(quote: QuoteDetail, offer: Offer | null, fleet: Vehicle[]): RentalContractData {
  const data = emptyContractData()
  const byId = new Map(fleet.map(v => [v.id, v]))
  const period = splitDates(quote.dates)

  data.renter = {
    name: [quote.name, quote.company].filter(Boolean).join(' · '),
    idNo: quote.kennitala ?? '',
    phone: quote.phone ?? '',
    passportNo: '',
    address: '',
    email: quote.email,
    licenceNo: '',
    licenceCountryExpiry: '',
  }
  data.annexBContact = [quote.name, quote.phone].filter(Boolean).join(', ')

  if (!offer) {
    // No priced offer yet: vehicle rows straight from the quote items.
    for (const qi of quote.items) {
      if (qi.itemType !== 'vehicle') continue
      const vehicle = byId.get(qi.itemId)
      for (let n = 0; n < qi.qty; n++) {
        data.vehicles.push({
          ...emptyVehicle(),
          vehicleId: qi.itemId,
          makeModel: qi.name.en,
          regNo: vehicle?.plates?.length === 1 ? vehicle.plates[0]! : (vehicle?.plates?.[n] ?? ''),
          fuel: fuelFor(vehicle),
          pickupAt: period.pickup,
          returnAt: period.return,
          annexKind: annexKindFor(vehicle),
        })
      }
    }
    return data
  }

  data.currency = offer.currency
  data.vatRate = offer.vatRate
  // Gross → printed: strip the proportional discount share, add VAT.
  const factor = (offer.subtotal > 0 ? (offer.subtotal - offer.discountAmount) / offer.subtotal : 1) * (1 + offer.vatRate / 100)
  const printed = (gross: number) => offer.currency === 'ISK' ? Math.round(gross * factor) : Math.round(gross * factor * 100) / 100

  let rentalGross = 0
  let insuranceGross = 0
  let driversGross = 0
  let extrasGross = 0
  const extrasText: string[] = []
  const daysSeen = new Set<number>()
  let insuranceRate: number | null = null
  let driversCount = 0
  let driversRate: number | null = null
  let unitsWithInsurance = 0

  for (const item of offer.items) {
    if (item.itemType === 'vehicle' || (!item.itemType && byId.has(item.itemId ?? ''))) {
      const vehicle = byId.get(item.itemId ?? '')
      const days = lineDays(item)
      if (days) daysSeen.add(days)
      // Per-day rate: a weekly price is spread over seven days, a flat price
      // is printed as the rate with no day count.
      const ratePerDay = item.pricing === 'day' ? item.unitPrice
        : item.pricing === 'week' ? Math.round(item.unitPrice / 7) : item.unitPrice
      rentalGross += item.lineTotal
      for (const e of item.extras ?? []) {
        if (e.kind === 'insurance') {
          insuranceGross += e.total
          insuranceRate = insuranceRate ?? e.unitPrice
          unitsWithInsurance += item.qty
        }
        else if (e.kind === 'driver') {
          driversGross += e.total
          if (e.unlimited) extrasText.push('Unlimited drivers')
          else {
            driversCount += e.qty
            driversRate = driversRate ?? e.unitPrice
          }
        }
        else {
          extrasGross += e.total
          extrasText.push(`${e.qty.toLocaleString('en-US')} km`)
        }
      }
      for (let n = 0; n < item.qty; n++) {
        data.vehicles.push({
          ...emptyVehicle(),
          vehicleId: item.itemId,
          makeModel: item.name.en,
          regNo: vehicle?.plates?.length === 1 ? vehicle.plates[0]! : (vehicle?.plates?.[n] ?? ''),
          fuel: fuelFor(vehicle),
          pickupAt: period.pickup,
          returnAt: period.return,
          kmOut: '',
          fRoads: false,
          ratePerDay: printed(ratePerDay),
          annexKind: annexKindFor(vehicle),
        })
      }
    }
    else {
      // Equipment and services ride along as "extras".
      extrasGross += item.lineTotal + (item.extras ?? []).reduce((s, e) => s + e.total, 0)
      extrasText.push(item.qty > 1 ? `${item.qty}× ${item.name.en}` : item.name.en)
    }
  }

  const days = daysSeen.size === 1 ? [...daysSeen][0]! : null
  const vehicleUnits = data.vehicles.length
  data.charges = {
    rentalDays: days,
    // Single-vehicle layout prints "days × rate per day"; only meaningful for one unit.
    rentalRate: vehicleUnits === 1 && days ? printed(rentalGross / days) : null,
    rental: printed(rentalGross),
    insuranceDays: insuranceGross > 0 ? days : null,
    insuranceRate: insuranceGross > 0 && insuranceRate != null && unitsWithInsurance === 1 ? printed(insuranceRate) : null,
    insurance: insuranceGross > 0 ? printed(insuranceGross) : null,
    driversCount: driversCount || null,
    driversDays: driversCount ? days : null,
    driversRate: driversCount && driversRate != null ? printed(driversRate) : null,
    extrasText: extrasText.join(', ').slice(0, MAX_TEXT),
    extras: driversGross + extrasGross > 0 ? printed(driversGross + extrasGross) : null,
    total: offer.currency === 'ISK' ? Math.round(offer.total) : offer.total,
  }
  return data
}

// ── Validation (admin PUT) ───────────────────────────────────────────────────

const text = (v: unknown, max = MAX_TEXT) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const flag = (v: unknown) => v === true
const num = (v: unknown): number | null => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : typeof v === 'number' ? v : NaN
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null
}
const oneOf = <T extends string>(options: readonly T[], v: unknown, fallback: T): T =>
  options.includes(v as T) ? (v as T) : fallback

/** Normalise an admin-submitted contract document. Unknown values fall back; nothing throws. */
export function parseContractData(body: unknown): RentalContractData {
  const b = (body ?? {}) as Record<string, unknown>
  const r = (b.renter ?? {}) as Record<string, unknown>
  const c = (b.charges ?? {}) as Record<string, unknown>
  const base = emptyContractData()
  return {
    template: oneOf<ContractTemplate>(['auto', 'single', 'multi'], b.template, 'auto'),
    agreementDate: /^\d{4}-\d{2}-\d{2}$/.test(text(b.agreementDate)) ? text(b.agreementDate) : base.agreementDate,
    renter: {
      name: text(r.name), idNo: text(r.idNo), phone: text(r.phone), passportNo: text(r.passportNo),
      address: text(r.address), email: text(r.email), licenceNo: text(r.licenceNo), licenceCountryExpiry: text(r.licenceCountryExpiry),
    },
    drivers: (Array.isArray(b.drivers) ? b.drivers : []).slice(0, MAX_ROWS).map((d: Record<string, unknown>) => ({
      name: text(d?.name), idNo: text(d?.idNo), licenceNo: text(d?.licenceNo),
      issuingCountry: text(d?.issuingCountry), expiry: text(d?.expiry), phone: text(d?.phone),
    })).filter(d => Object.values(d).some(Boolean)),
    pickupLocation: text(b.pickupLocation),
    returnLocation: text(b.returnLocation),
    kmUnlimited: flag(b.kmUnlimited),
    kmPerDay: num(b.kmPerDay),
    vehicles: (Array.isArray(b.vehicles) ? b.vehicles : []).slice(0, MAX_ROWS).map((v: Record<string, unknown>) => ({
      ...(text(v?.vehicleId) ? { vehicleId: text(v.vehicleId) } : {}),
      makeModel: text(v?.makeModel),
      regNo: text(v?.regNo, 16).toUpperCase(),
      fuel: oneOf<ContractFuel>(['', 'petrol', 'diesel', 'electric'], v?.fuel, ''),
      pickupAt: text(v?.pickupAt),
      returnAt: text(v?.returnAt),
      kmOut: text(v?.kmOut, 20),
      fRoads: flag(v?.fRoads),
      ratePerDay: num(v?.ratePerDay),
      annexKind: oneOf<ContractAnnexKind>(['pickup', 'van', 'box', 'generic', 'none'], v?.annexKind, 'generic'),
    })),
    currency: oneOf<OfferCurrency>(['ISK', 'EUR'], b.currency, 'ISK'),
    vatRate: num(b.vatRate) ?? 24,
    charges: {
      rentalDays: num(c.rentalDays), rentalRate: num(c.rentalRate), rental: num(c.rental),
      insuranceDays: num(c.insuranceDays), insuranceRate: num(c.insuranceRate), insurance: num(c.insurance),
      driversCount: num(c.driversCount), driversDays: num(c.driversDays), driversRate: num(c.driversRate),
      extrasText: text(c.extrasText), extras: num(c.extras), total: num(c.total),
    },
    paymentMethod: oneOf<ContractPaymentMethod>(['', 'card', 'bank', 'invoice'], b.paymentMethod, ''),
    paymentRef: text(b.paymentRef),
    paymentTiming: oneOf<ContractPaymentTiming>(['', 'pickup', 'invoice', 'return'], b.paymentTiming, ''),
    existingDamage: text(b.existingDamage, MAX_LONG_TEXT),
    annexA: flag(b.annexA),
    photosTaken: flag(b.photosTaken),
    annexB: flag(b.annexB),
    annexBContact: text(b.annexBContact),
    annexBProject: text(b.annexBProject),
    placeAndDate: text(b.placeAndDate),
    licenceNo: text(b.licenceNo, 40),
  }
}

// ── Storage ──────────────────────────────────────────────────────────────────

export function createContract(quoteId: string | null, offerId: number | null, data: RentalContractData): RentalContract {
  const now = new Date().toISOString()
  const result = getDb().prepare(`
    INSERT INTO rental_contracts (quote_id, offer_id, created_at, updated_at, data) VALUES (?, ?, ?, ?, ?)
  `).run(quoteId, offerId, now, now, JSON.stringify(data))
  return getContract(Number(result.lastInsertRowid))!
}

export function getContract(id: number): RentalContract | null {
  const row = getDb().prepare('SELECT * FROM rental_contracts WHERE id = ?').get(id) as Record<string, unknown> | undefined
  return row ? rowToContract(row) : null
}

export function updateContract(id: number, data: RentalContractData): RentalContract | null {
  const changed = getDb().prepare('UPDATE rental_contracts SET data = ?, updated_at = ? WHERE id = ?')
    .run(JSON.stringify(data), new Date().toISOString(), id).changes
  return changed ? getContract(id) : null
}

export function deleteContract(id: number): boolean {
  return getDb().prepare('DELETE FROM rental_contracts WHERE id = ?').run(id).changes > 0
}

export function listContracts(quoteId?: string): RentalContractSummary[] {
  const rows = (quoteId
    ? getDb().prepare('SELECT * FROM rental_contracts WHERE quote_id = ? ORDER BY id DESC').all(quoteId)
    : getDb().prepare('SELECT * FROM rental_contracts ORDER BY id DESC').all()) as Record<string, unknown>[]
  return rows.map((r) => {
    const c = rowToContract(r)
    return {
      id: c.id,
      number: c.number,
      quoteId: c.quoteId,
      offerId: c.offerId,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      renterName: c.data.renter.name,
      vehicleCount: c.data.vehicles.length,
      regNos: c.data.vehicles.map(v => v.regNo).filter(Boolean),
      total: c.data.charges.total,
      currency: c.data.currency,
      agreementDate: c.data.agreementDate,
    }
  })
}

function rowToContract(r: Record<string, unknown>): RentalContract {
  const id = r.id as number
  // Older documents may lack fields added later: layer them over the defaults.
  const saved = JSON.parse(r.data as string) as Partial<RentalContractData>
  const data: RentalContractData = { ...emptyContractData(), ...saved, charges: { ...emptyCharges(), ...(saved.charges ?? {}) } }
  return {
    id,
    number: contractNumber(id),
    quoteId: (r.quote_id as string | null) ?? undefined,
    offerId: (r.offer_id as number | null) ?? undefined,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
    data,
  }
}
