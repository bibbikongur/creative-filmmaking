import type { CartEntry, CartItemType } from '~/types'

const MAX_ITEMS = 40

// The visitor's quote list ("cart") — persisted in a cookie so it survives
// reloads and renders correctly during SSR (header badge). Entries hold only
// {type, id, qty}; names/images are resolved against the catalogue on render
// and snapshotted server-side on submit.
export const useCart = () => {
  const cookie = useCookie<CartEntry[]>('cf_cart', {
    default: () => [],
    maxAge: 60 * 60 * 24 * 30,
  })
  // Single reactive source shared across components; the cookie is the
  // persistence layer written on every mutation.
  const entries = useState<CartEntry[]>('cart', () => cookie.value || [])
  const persist = () => { cookie.value = entries.value }

  const find = (type: CartItemType, id: string) =>
    entries.value.find(e => e.type === type && e.id === id)

  const has = (type: CartItemType, id: string) => Boolean(find(type, id))

  const add = (type: CartItemType, id: string) => {
    const existing = find(type, id)
    if (existing) {
      // Vehicles are unique physical units; equipment can be rented in multiples.
      if (type === 'equipment') existing.qty += 1
    }
    else if (entries.value.length < MAX_ITEMS) {
      entries.value = [...entries.value, { type, id, qty: 1 }]
    }
    persist()
  }

  const setQty = (type: CartItemType, id: string, qty: number) => {
    const entry = find(type, id)
    if (!entry) return
    entry.qty = Math.max(1, Math.round(qty) || 1)
    persist()
  }

  const remove = (type: CartItemType, id: string) => {
    entries.value = entries.value.filter(e => !(e.type === type && e.id === id))
    persist()
  }

  const clear = () => {
    entries.value = []
    persist()
  }

  /** Drop entries whose catalogue item no longer exists (deleted in admin). */
  const prune = (validIds: { vehicle: Set<string>, equipment: Set<string> }) => {
    const pruned = entries.value.filter(e => validIds[e.type].has(e.id))
    if (pruned.length !== entries.value.length) {
      entries.value = pruned
      persist()
    }
  }

  const count = computed(() => entries.value.reduce((sum, e) => sum + e.qty, 0))

  return { entries, has, add, setQty, remove, clear, prune, count }
}
