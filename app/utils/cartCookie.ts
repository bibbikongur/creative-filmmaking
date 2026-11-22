import type { CartEntry } from '~/types'

// Cookie form of the visitor's quote list. A browser drops any cookie over
// ~4 KB, and URL-encoded JSON spends ~90 bytes per line, which is why the
// list used to stop at 40. The compact form below ("e:e-016:2|v:v-010") costs
// ~18 bytes per line; whatever still does not fit is kept in localStorage by
// useCart, so the list itself has no maximum.

/** Room for the value inside the 4096-byte cookie, name and attributes aside. */
export const CART_COOKIE_BUDGET = 3800

const CODE_OF: Partial<Record<CartEntry['type'], string>> = { vehicle: 'v', equipment: 'e' }
const TYPE_OF: Record<string, CartEntry['type']> = { v: 'vehicle', e: 'equipment' }

const isEntry = (e: unknown): e is CartEntry => {
  const x = e as CartEntry | null
  return Boolean(x) && typeof x!.id === 'string' && Boolean(x!.id)
    && (x!.type === 'vehicle' || x!.type === 'equipment')
}

const cleanQty = (qty: unknown) => Math.max(1, Math.round(Number(qty)) || 1)

/** One line: type code, id, and the quantity when it is not 1. */
const encodeEntry = (e: CartEntry) => {
  const qty = cleanQty(e.qty)
  return `${CODE_OF[e.type]}:${encodeURIComponent(e.id)}${qty > 1 ? `:${qty}` : ''}`
}

export const encodeCart = (entries: CartEntry[] | null | undefined): string =>
  (entries ?? []).filter(isEntry).map(encodeEntry).join('|')

/** Reads the compact form, and the URL-encoded JSON that older cookies hold. */
export const decodeCart = (raw: string | null | undefined): CartEntry[] | null => {
  if (!raw) return null
  try {
    if (raw.startsWith('%5B') || raw.startsWith('[')) {
      const parsed: unknown = JSON.parse(decodeURIComponent(raw))
      if (!Array.isArray(parsed)) return null
      return parsed.filter(isEntry).map(e => ({ type: e.type, id: e.id, qty: cleanQty(e.qty) }))
    }
    const entries: CartEntry[] = []
    for (const part of raw.split('|')) {
      const [code, id, qty] = part.split(':')
      const type = TYPE_OF[code ?? '']
      if (type && id) entries.push({ type, id: decodeURIComponent(id), qty: cleanQty(qty ?? 1) })
    }
    return entries
  }
  catch {
    return null
  }
}

/** Splits the list into the lines the cookie can carry and the overflow. */
export const splitCartForCookie = (entries: CartEntry[], budget = CART_COOKIE_BUDGET) => {
  let used = 0
  let fit = 0
  for (const e of entries) {
    used += encodeEntry(e).length + (fit ? 1 : 0)
    if (used > budget) break
    fit++
  }
  return fit === entries.length
    ? { head: entries, rest: [] as CartEntry[] }
    : { head: entries.slice(0, fit), rest: entries.slice(fit) }
}
