import type {
  CartItemType, ItemRental, ItemRentalStats, OfferCurrency, OfferItem, RentalStatsSummary,
} from '~~/app/types'

// ─────────────────────────────────────────────────────────────────────────────
// Rental statistics — derived from confirmed offers (offers.confirmed_at). An
// offer is confirmed by hand in the admin once the customer accepts it; from
// then on every line of that offer counts as a rental of that catalogue item.
//
// Figures are kept per currency (ISK / EUR) and never converted: the exchange
// rate used when the offer was written is not stored, and mixing currencies
// would only produce a number nobody can reconcile with the PDFs.
//
//   gross = line total incl. vehicle extras, before discount and VAT
//   net   = gross minus the line's proportional share of the offer discount
// ─────────────────────────────────────────────────────────────────────────────

const zero = (): Record<OfferCurrency, number> => ({ ISK: 0, EUR: 0 })
const round2 = (n: number) => Math.round(n * 100) / 100

const lineGross = (item: OfferItem) =>
  item.lineTotal + (item.extras ?? []).reduce((s, e) => s + e.total, 0)

/** Days charged on a line (per-day or per-week pricing); undefined for flat prices. */
const lineDays = (item: OfferItem): number | undefined => {
  if (item.pricing === 'day' && item.days) return item.days
  if (item.pricing === 'week' && item.weeks) return Math.round(item.weeks * 7)
  return undefined
}

export interface RentalStatsResult {
  summary: RentalStatsSummary
  items: ItemRentalStats[]
}

export async function getRentalStats(): Promise<RentalStatsResult> {
  const confirmed = listConfirmedOffers()

  // Offers created before the snapshot carried itemType/itemId: resolve the
  // catalogue reference through quote_items while those rows still exist.
  const missingRefs = confirmed.flatMap(({ offer }) =>
    offer.items.filter(i => !i.itemType || !i.itemId).map(i => i.quoteItemId))
  const refs = getQuoteItemRefs(missingRefs)

  const [vehicles, equipment] = await Promise.all([getVehicles(), getEquipment()])
  const live = {
    vehicle: new Map(vehicles.map(v => [v.id, v])),
    equipment: new Map(equipment.map(e => [e.id, e])),
  }

  const byKey = new Map<string, ItemRentalStats>()
  const summary: RentalStatsSummary = { confirmedOffers: confirmed.length, gross: zero(), net: zero(), total: zero() }

  for (const { quote, offer } of confirmed) {
    const confirmedAt = offer.confirmedAt!
    summary.total[offer.currency] += offer.total
    // Discount is spread over the lines in proportion to their gross.
    const discountShare = offer.subtotal > 0 ? offer.discountAmount / offer.subtotal : 0

    for (const item of offer.items) {
      const ref = item.itemType && item.itemId
        ? { itemType: item.itemType, itemId: item.itemId }
        : refs.get(item.quoteItemId)
      // Fall back to the English name so a line never silently disappears
      // from the statistics just because its quote item was edited away.
      const itemType: CartItemType = ref?.itemType ?? 'equipment'
      const itemId = ref?.itemId ?? `name:${item.name.en.trim().toLowerCase()}`
      const key = `${itemType}:${itemId}`

      let stats = byKey.get(key)
      if (!stats) {
        const liveItem = itemType === 'vehicle'
          ? live.vehicle.get(itemId)
          : itemType === 'equipment' ? live.equipment.get(itemId) : undefined
        stats = {
          key,
          itemType,
          itemId,
          name: liveItem?.name ?? item.name,
          image: liveItem?.images[0] ?? item.image,
          inCatalogue: itemType === 'service' ? true : !!liveItem,
          timesRented: 0,
          unitsRented: 0,
          rentalDays: 0,
          gross: zero(),
          net: zero(),
          rentals: [],
        }
        byKey.set(key, stats)
      }

      const gross = round2(lineGross(item))
      const net = round2(gross * (1 - discountShare))
      const days = lineDays(item)

      stats.timesRented += 1
      stats.unitsRented += item.qty
      if (days) stats.rentalDays += days * item.qty
      stats.gross[offer.currency] = round2(stats.gross[offer.currency] + gross)
      stats.net[offer.currency] = round2(stats.net[offer.currency] + net)
      if (!stats.lastRentedAt || confirmedAt > stats.lastRentedAt) stats.lastRentedAt = confirmedAt
      summary.gross[offer.currency] = round2(summary.gross[offer.currency] + gross)
      summary.net[offer.currency] = round2(summary.net[offer.currency] + net)

      const rental: ItemRental = {
        quoteId: quote.id,
        offerId: offer.id,
        confirmedAt,
        customer: quote.name || quote.email,
        company: quote.company,
        dates: quote.dates,
        qty: item.qty,
        days,
        currency: offer.currency,
        gross,
        net,
      }
      stats.rentals.push(rental)
    }
  }

  summary.total.ISK = round2(summary.total.ISK)
  summary.total.EUR = round2(summary.total.EUR)

  // Most-rented first; ties broken by ISK gross, then EUR gross.
  const items = [...byKey.values()].sort((a, b) =>
    b.timesRented - a.timesRented || b.gross.ISK - a.gross.ISK || b.gross.EUR - a.gross.EUR)
  return { summary, items }
}

/** Statistics for one catalogue item, or null when it has never been on a confirmed offer. */
export async function getItemRentalStats(itemType: CartItemType, itemId: string): Promise<ItemRentalStats | null> {
  const { items } = await getRentalStats()
  return items.find(i => i.itemType === itemType && i.itemId === itemId) ?? null
}
