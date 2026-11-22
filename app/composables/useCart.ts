import type { CartEntry, CartItemType } from '~/types'

// Lines past what the cookie can carry (see utils/cartCookie) live here, so
// the list has no maximum. Only a list of 200+ lines ever reaches it.
const OVERFLOW_KEY = 'cf_cart_more'
let overflowRestored = false
let restoreScheduled = false

const readOverflow = (): CartEntry[] => {
  try {
    return decodeCart(localStorage.getItem(OVERFLOW_KEY)) ?? []
  }
  catch {
    return []
  }
}

const writeOverflow = (rest: CartEntry[]) => {
  try {
    if (rest.length) localStorage.setItem(OVERFLOW_KEY, encodeCart(rest))
    else localStorage.removeItem(OVERFLOW_KEY)
  }
  catch {
    // Storage blocked (private mode): the cookie still carries what fits.
  }
}

// The visitor's quote list ("cart") — persisted in a cookie so it survives
// reloads and renders correctly during SSR (header badge). Entries hold only
// {type, id, qty}; names/images are resolved against the catalogue on render
// and snapshotted server-side on submit.
export const useCart = () => {
  // No default value: a default would be written back as an empty cookie on
  // every first visit (crawlers included), which keeps the HTML from being
  // cached. The cookie only exists once something is on the list.
  const cookie = useCookie<CartEntry[] | null>('cf_cart', {
    maxAge: 60 * 60 * 24 * 30,
    encode: encodeCart,
    decode: decodeCart,
  })
  // Single reactive source shared across components; the cookie is the
  // persistence layer written on every mutation.
  const entries = useState<CartEntry[]>('cart', () => cookie.value || [])
  const persist = () => {
    const { head, rest } = splitCartForCookie(entries.value)
    cookie.value = head.length ? head : null
    if (import.meta.client) writeOverflow(rest)
  }

  const find = (type: CartItemType, id: string) =>
    entries.value.find(e => e.type === type && e.id === id)

  // Appends the lines kept in localStorage. Runs once hydration is done (the
  // server only saw the cookie) and before any change, so a write never
  // replaces overflow that has not been read yet.
  const restoreOverflow = () => {
    if (!import.meta.client || overflowRestored) return
    overflowRestored = true
    const rest = readOverflow()
    if (!rest.length) return
    // Overflow only exists beside a full cookie. Without one the list was
    // emptied or the cookie expired, and the leftovers go with it.
    if (!entries.value.length) return writeOverflow([])
    entries.value = [...entries.value, ...rest.filter(r => !find(r.type, r.id))]
  }
  if (import.meta.client && !restoreScheduled) {
    restoreScheduled = true
    onNuxtReady(restoreOverflow)
  }

  const has = (type: CartItemType, id: string) => Boolean(find(type, id))

  const add = (type: CartItemType, id: string) => {
    restoreOverflow()
    const existing = find(type, id)
    if (existing) {
      // Vehicles are unique physical units; equipment can be rented in multiples.
      if (type === 'equipment') existing.qty += 1
    }
    else {
      entries.value = [...entries.value, { type, id, qty: 1 }]
    }
    persist()
  }

  const setQty = (type: CartItemType, id: string, qty: number) => {
    restoreOverflow()
    const entry = find(type, id)
    if (!entry) return
    entry.qty = Math.max(1, Math.round(qty) || 1)
    persist()
  }

  const remove = (type: CartItemType, id: string) => {
    restoreOverflow()
    entries.value = entries.value.filter(e => !(e.type === type && e.id === id))
    persist()
  }

  const clear = () => {
    entries.value = []
    persist()
  }

  /** Drop entries whose catalogue item no longer exists (deleted in admin). */
  const prune = (validIds: { vehicle: Set<string>, equipment: Set<string> }) => {
    restoreOverflow()
    // Services never enter the public cart (admin-only quote lines), so an
    // entry of any other type is dropped.
    const pruned = entries.value.filter(e => (e.type === 'vehicle' || e.type === 'equipment') && validIds[e.type].has(e.id))
    if (pruned.length !== entries.value.length) {
      entries.value = pruned
      persist()
    }
  }

  const count = computed(() => entries.value.reduce((sum, e) => sum + e.qty, 0))

  return { entries, has, add, setQty, remove, clear, prune, count }
}
