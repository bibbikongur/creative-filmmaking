import { describe, expect, it } from 'vitest'
import type { CartEntry } from '../app/types'
import { CART_COOKIE_BUDGET, decodeCart, encodeCart, splitCartForCookie } from '../app/utils/cartCookie'

const list = (n: number): CartEntry[] =>
  Array.from({ length: n }, (_, i) => ({ type: 'equipment', id: `e-mr754b${String(i).padStart(6, '0')}`, qty: 1 + (i % 3) }))

describe('cart cookie', () => {
  it('round-trips types, ids and quantities', () => {
    const entries: CartEntry[] = [
      { type: 'vehicle', id: 'v-010', qty: 1 },
      { type: 'equipment', id: 'e-mr754bhada10', qty: 12 },
      { type: 'equipment', id: 'odd id:with|marks', qty: 2 },
    ]
    expect(encodeCart(entries)).toBe('v:v-010|e:e-mr754bhada10:12|e:odd%20id%3Awith%7Cmarks:2')
    expect(decodeCart(encodeCart(entries))).toEqual(entries)
  })

  it('still reads the URL-encoded JSON of older cookies', () => {
    const old = [{ type: 'equipment', id: 'e-016', qty: 3 }, { type: 'vehicle', id: 'v-011', qty: 1 }]
    expect(decodeCart(encodeURIComponent(JSON.stringify(old)))).toEqual(old)
  })

  it('drops malformed lines instead of failing', () => {
    expect(decodeCart('')).toBeNull()
    expect(decodeCart('x:nope|e:e-016:abc|e:|v:v-010:0')).toEqual([
      { type: 'equipment', id: 'e-016', qty: 1 },
      { type: 'vehicle', id: 'v-010', qty: 1 },
    ])
    expect(decodeCart('%5Bnot json')).toBeNull()
    expect(encodeCart(null)).toBe('')
  })

  it('carries well over the old 40-line limit in one cookie', () => {
    const entries = list(150)
    expect(encodeCart(entries).length).toBeLessThan(CART_COOKIE_BUDGET)
    expect(splitCartForCookie(entries)).toEqual({ head: entries, rest: [] })
  })

  it('splits what the cookie cannot carry without losing a line', () => {
    const entries = list(1000)
    const { head, rest } = splitCartForCookie(entries)
    expect(encodeCart(head).length).toBeLessThanOrEqual(CART_COOKIE_BUDGET)
    expect(rest.length).toBeGreaterThan(0)
    expect([...head, ...rest]).toEqual(entries)
    // The next line would not have fit.
    expect(encodeCart([...head, rest[0]!]).length).toBeGreaterThan(CART_COOKIE_BUDGET)
    expect(decodeCart(encodeCart(rest))).toEqual(rest)
  })
})
