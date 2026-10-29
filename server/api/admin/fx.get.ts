// EUR→ISK reference rate for the offer form's currency switch. Sourced from
// the ECB daily reference rates (via frankfurter.dev, no API key), cached in
// memory for six hours; a stale cached value or a fixed fallback is served if
// the fetch fails so the form never blocks on it.

const FALLBACK_EUR_ISK = 140
const TTL_MS = 6 * 60 * 60 * 1000

interface FxRate {
  /** How many ISK one EUR buys. */
  eurIsk: number
  /** Rate date (YYYY-MM-DD). */
  date: string
  source: 'ecb' | 'fallback'
}

let cached: { rate: FxRate, fetchedAt: number } | null = null

export default defineEventHandler(async (event): Promise<FxRate> => {
  await requireAdmin(event)
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) return cached.rate
  try {
    const res = await $fetch<{ date: string, rates: { ISK?: number } }>(
      'https://api.frankfurter.dev/v1/latest',
      { query: { base: 'EUR', symbols: 'ISK' }, timeout: 5000 },
    )
    const eurIsk = Number(res?.rates?.ISK)
    if (!Number.isFinite(eurIsk) || eurIsk <= 0) throw new Error('No ISK rate in response')
    cached = { rate: { eurIsk, date: res.date, source: 'ecb' }, fetchedAt: Date.now() }
    return cached.rate
  }
  catch (error) {
    console.warn('[fx] Could not fetch EUR/ISK rate:', (error as Error)?.message)
    // Keep serving the last good rate if we have one, otherwise the fallback.
    return cached?.rate ?? { eurIsk: FALLBACK_EUR_ISK, date: new Date().toISOString().slice(0, 10), source: 'fallback' }
  }
})
