import type { Offer } from '~~/app/types'

// ─────────────────────────────────────────────────────────────────────────────
// What every line of an offer costs once the offer discount is taken off.
//
// The discount is stored once per offer (a percentage or a fixed amount off the
// subtotal). To show it per line it is spread over the lines, and their
// add-ons, in proportion to what each one costs. The amounts are rounded to
// what the currency prints (whole krónur, euro cents) and always add up to
// the offer's net amount: the rounding is carried from one row to the next
// instead of being lost. Unit prices keep two decimals in either currency, so
// a small rate such as 45 kr./km is not distorted (40.5, not 41).
// ─────────────────────────────────────────────────────────────────────────────

export interface DiscountedExtra {
  unitPrice: number
  total: number
}

export interface DiscountedLine {
  /** Price per unit (per day, per week or flat) after the discount. */
  unitPrice: number
  /** Line total after the discount, without add-ons. */
  lineTotal: number
  /** Same order as the item's extras. */
  extras: DiscountedExtra[]
  /** Line total plus add-ons, after the discount. */
  groupTotal: number
}

/** One entry per offer item, or null when the offer carries no discount. */
export function discountedLines(
  offer: Pick<Offer, 'items' | 'subtotal' | 'discountAmount' | 'currency'>,
): DiscountedLine[] | null {
  if (!(offer.discountAmount > 0) || !(offer.subtotal > 0)) return null
  const factor = Math.max(0, offer.subtotal - offer.discountAmount) / offer.subtotal
  const scale = offer.currency === 'ISK' ? 1 : 100
  const round = (n: number) => Math.round(n * scale) / scale
  const round2 = (n: number) => Math.round(n * 100) / 100

  let listSoFar = 0
  let netSoFar = 0
  const take = (listAmount: number) => {
    listSoFar += listAmount
    const next = round(listSoFar * factor)
    const part = round(next - netSoFar)
    netSoFar = next
    return part
  }

  return offer.items.map((item) => {
    const lineTotal = take(item.lineTotal)
    const extras = (item.extras ?? []).map(e => ({ unitPrice: round2(e.unitPrice * factor), total: take(e.total) }))
    return {
      unitPrice: round2(item.unitPrice * factor),
      lineTotal,
      extras,
      groupTotal: round(lineTotal + extras.reduce((sum, e) => sum + e.total, 0)),
    }
  })
}
