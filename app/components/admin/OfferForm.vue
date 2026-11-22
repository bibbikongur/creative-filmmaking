<template>
  <div class="admin-card p-5 sm:p-6">
    <!-- Apply pricing to every item at once -->
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2 pb-3">
      <h3 class="admin-card-title">Prices</h3>
      <div class="ml-auto flex flex-wrap items-center gap-2">
        <span class="text-xs text-bone-400 max-sm:w-full">Set every item to</span>
        <select v-model="bulkMode" class="input-dark !w-36 !py-2" aria-label="Pricing for every item">
          <option value="flat">Flat price</option>
          <option value="day">Per day</option>
          <option value="week">Per week</option>
        </select>
        <label v-if="bulkMode === 'day' || bulkMode === 'week'" class="flex items-center gap-2 text-xs text-bone-400">
          <span aria-hidden="true">×</span>
          <input
            v-model.number="bulkPeriod"
            type="number"
            :min="bulkMode === 'week' ? 0.5 : 1"
            max="999"
            :step="bulkMode === 'week' ? 0.5 : 1"
            class="input-dark !w-16 !px-2 !py-2 text-right"
            :aria-label="bulkMode === 'week' ? 'Number of weeks' : 'Number of days'"
            :title="bulkMode === 'week' ? 'Number of weeks (e.g. 1.5)' : 'Number of days'"
          >
          {{ unit(bulkMode, bulkPeriod) }}
        </label>
        <button type="button" class="btn-outline btn-sm" @click="applyToAll">
          Apply
        </button>
      </div>
    </div>

    <!-- Item pricing. Every item is a small table with the same four columns,
         so what is charged, for how many, at what price and what it comes to
         always sit in the same place:
         charge · option · how many / how long · unit price · row total -->
    <div class="admin-eyebrow hidden border-b border-ink-800 pb-2 sm:pl-[3.75rem] md:grid" :class="row">
      <span>Charge</span>
      <span>Option</span>
      <span>Qty / period</span>
      <span>Unit price</span>
      <span class="text-right">Total</span>
    </div>
    <div class="divide-y divide-ink-800">
      <section v-for="item in quote.items" :key="item.id" class="py-4" :aria-label="item.name.en">
        <!-- What it is, and what it comes to -->
        <div class="flex items-start gap-3">
          <AdminThumb :src="item.image" :alt="item.name.en" size="sm" :icon="item.itemType === 'vehicle' ? 'vehicles' : 'equipment'" />
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-bone-100">
              {{ item.name.en }}
              <span v-if="item.qty > 1" class="admin-chip ml-1.5 border-ink-500 text-bone-100">× {{ item.qty }}</span>
            </p>
            <p class="mt-0.5 text-xs text-ink-400">
              <span class="capitalize">{{ item.itemType }}</span><template v-if="item.note"> · {{ item.note }}</template>
            </p>
          </div>
          <p class="shrink-0 text-right">
            <span v-if="lineTotal(item) != null" class="block font-heading text-lg font-semibold tabular-nums text-bone-100">{{ fmt(lineTotal(item)! + extrasTotal(item)) }}</span>
            <span v-else class="block text-sm text-gold-400">Price missing</span>
            <span v-if="item.itemType === 'vehicle' && extrasTotal(item) > 0" class="block text-xs tabular-nums text-ink-400">incl. {{ fmt(extrasTotal(item)) }} add-ons</span>
            <span v-if="discountAmount > 0 && lineTotal(item) != null" class="block text-xs tabular-nums text-gold-400">{{ fmt((lineTotal(item)! + extrasTotal(item)) * netFactor) }} after discount</span>
          </p>
        </div>

        <div class="mt-3 space-y-2 sm:pl-[3.75rem]">
          <!-- Rental -->
          <div class="grid items-center" :class="row">
            <span class="admin-eyebrow max-md:col-span-2">{{ item.itemType === 'service' ? 'Price' : 'Rental' }}</span>
            <select v-model="modes[item.id]" class="input-dark !py-2 max-md:col-span-2" :aria-label="`Pricing for ${item.name.en}`">
              <option value="flat">Flat price</option>
              <option value="day">Per day</option>
              <option value="week">Per week</option>
            </select>
            <template v-if="modes[item.id] === 'day' || modes[item.id] === 'week'">
            <span class="relative block">
              <input
                v-model.number="periods[item.id]"
                type="number"
                class="input-dark !py-2 text-right !pr-16"
                :min="modes[item.id] === 'week' ? 0.5 : 1"
                max="999"
                :step="modes[item.id] === 'week' ? 0.5 : 1"
                :aria-label="modes[item.id] === 'week' ? 'Number of weeks' : 'Number of days'"
                :title="modes[item.id] === 'week' ? 'Number of weeks (e.g. 1.5)' : 'Number of days'"
              >
              <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 whitespace-nowrap text-xs text-ink-400" aria-hidden="true">{{ unit(modes[item.id], periods[item.id]) }}</span>
            </span>
            </template>
            <span v-else class="text-xs text-ink-400 max-md:hidden">One price</span>
            <span class="relative block">
              <input
                v-model.number="prices[item.id]"
                type="number"
                class="input-dark !py-2 text-right !pr-[4.5rem]"
                min="0"
                step="any"
                placeholder="0"
                :aria-label="`${pricePlaceholder(item.id)} for ${item.name.en}`"
              >
              <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 whitespace-nowrap text-xs text-ink-400" aria-hidden="true">{{ currencySuffix }}{{ per(modes[item.id]) }}</span>
            </span>
            <p class="text-right text-sm tabular-nums max-md:col-span-2">
              <span v-if="lineTotal(item) != null" class="text-bone-100">{{ fmt(lineTotal(item)!) }}</span>
              <span v-else class="text-ink-400">–</span>
              <span v-if="item.qty > 1 && lineTotal(item) != null" class="block text-[11px] text-ink-400">{{ item.qty }} × {{ fmt(lineTotal(item)! / item.qty) }}</span>
              <span v-for="t in discountNotes(lineTotal(item), prices[item.id], per(modes[item.id]))" :key="t" class="block text-[11px] text-gold-400">{{ t }}</span>
            </p>
          </div>

          <!-- Vehicle add-ons: insurance and drivers run over the rental period above, km is km × rate -->
          <template v-if="item.itemType === 'vehicle' && extras[item.id]">
            <div class="grid items-center" :class="row">
              <span class="admin-eyebrow max-md:col-span-2">Insurance</span>
              <select v-model="extras[item.id]!.insTier" class="input-dark !py-2 max-md:col-span-2" :aria-label="`Insurance for ${item.name.en}`">
                <option value="">None</option>
                <option v-for="t in INSURANCE_TIERS" :key="t" :value="t">{{ TIER_NAME[t] }}</option>
              </select>
              <template v-if="extras[item.id]!.insTier">
                <span class="text-xs leading-tight text-ink-400 max-md:hidden">{{ periodText(item.id) }}<span v-if="excessText(extras[item.id]!.insTier)" class="block">{{ excessText(extras[item.id]!.insTier) }}</span></span>
                <span class="relative block">
              <input
                v-model.number="extras[item.id]!.insPrice"
                type="number"
                class="input-dark !py-2 text-right !pr-[4.5rem]"
                min="0"
                step="any"
                placeholder="0"
                :aria-label="`Insurance: ${extraPlaceholder(item.id)}`"
                :title="item.qty > 1 ? `Per vehicle, multiplied by qty ${item.qty}` : undefined"
              >
              <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 whitespace-nowrap text-xs text-ink-400" aria-hidden="true">{{ currencySuffix }}{{ per(modes[item.id]) }}</span>
            </span>
                <p class="text-right text-sm tabular-nums text-bone-100 max-md:col-span-2">
                  {{ rowTotal(insuranceTotal(item)) }}
                  <span v-for="t in discountNotes(insuranceTotal(item), extras[item.id]!.insPrice, per(modes[item.id]))" :key="t" class="block text-[11px] text-gold-400">{{ t }}</span>
                </p>
              </template>
            </div>

            <div class="grid items-center" :class="row">
              <span class="admin-eyebrow max-md:col-span-2">Drivers</span>
              <select v-model="extras[item.id]!.driverMode" class="input-dark !py-2 max-md:col-span-2" :aria-label="`Extra drivers for ${item.name.en}`">
                <option value="">None</option>
                <option value="count">Additional</option>
                <option value="unlimited">Unlimited</option>
              </select>
              <template v-if="extras[item.id]!.driverMode">
                <template v-if="extras[item.id]!.driverMode === 'count'">
                <span class="relative block">
              <input
                v-model.number="extras[item.id]!.drivers"
                type="number"
                class="input-dark !py-2 text-right !pr-16"
                min="1"
                max="99"
                step="1"
                placeholder="1"
                aria-label="Number of additional drivers"
              >
              <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 whitespace-nowrap text-xs text-ink-400" aria-hidden="true">{{ extras[item.id]!.drivers === 1 ? 'driver' : 'drivers' }}</span>
            </span>
                </template>
                <span v-else class="text-xs text-ink-400 max-md:hidden">{{ periodText(item.id) }}</span>
                <span class="relative block">
              <input
                v-model.number="extras[item.id]!.driverPrice"
                type="number"
                class="input-dark !py-2 text-right !pr-[4.5rem]"
                min="0"
                step="any"
                placeholder="0"
                :aria-label="unlimitedDrivers(item.id) ? 'Price for unlimited drivers' : 'Price per driver'"
                :title="unlimitedDrivers(item.id)
                  ? (item.qty > 1 ? `Unlimited drivers per vehicle, multiplied by qty ${item.qty}` : 'Price for unlimited authorised drivers')
                  : `${extraPlaceholder(item.id)} per driver`"
              >
              <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 whitespace-nowrap text-xs text-ink-400" aria-hidden="true">{{ currencySuffix }}{{ per(modes[item.id]) }}</span>
            </span>
                <p class="text-right text-sm tabular-nums text-bone-100 max-md:col-span-2">
                  {{ rowTotal(driverTotal(item)) }}
                  <span v-for="t in discountNotes(driverTotal(item), extras[item.id]!.driverPrice, per(modes[item.id]))" :key="t" class="block text-[11px] text-gold-400">{{ t }}</span>
                </p>
              </template>
            </div>

            <div class="grid items-center" :class="row">
              <span class="admin-eyebrow max-md:col-span-2">Kilometres</span>
              <span class="text-xs text-ink-400 max-md:hidden">{{ (extras[item.id]!.km ?? 0) > 0 ? 'Charged per km' : 'Not charged' }}</span>
              <span class="relative block">
              <input
                v-model.number="extras[item.id]!.km"
                type="number"
                class="input-dark !py-2 text-right !pr-16"
                min="0"
                step="any"
                placeholder="0"
                aria-label="Number of kilometres"
              >
              <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 whitespace-nowrap text-xs text-ink-400" aria-hidden="true">km</span>
            </span>
              <template v-if="(extras[item.id]!.km ?? 0) > 0">
                <span class="relative block">
              <input
                v-model.number="extras[item.id]!.kmPrice"
                type="number"
                class="input-dark !py-2 text-right !pr-[4.5rem]"
                min="0"
                step="any"
                placeholder="0"
                aria-label="Price per kilometre"
              >
              <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 whitespace-nowrap text-xs text-ink-400" aria-hidden="true">{{ currencySuffix }}/km</span>
            </span>
                <p class="text-right text-sm tabular-nums text-bone-100 max-md:col-span-2">
                  {{ rowTotal(kmTotal(item)) }}
                  <span v-for="t in discountNotes(kmTotal(item), extras[item.id]!.kmPrice, '/km')" :key="t" class="block text-[11px] text-gold-400">{{ t }}</span>
                </p>
              </template>
            </div>
          </template>
        </div>
      </section>
    </div>

    <!-- Discount / currency / note -->
    <h3 class="admin-card-title mt-2 border-t border-ink-800 pt-5">Terms</h3>
    <div class="mt-4 grid gap-5 sm:grid-cols-3">
      <div>
        <label class="admin-label">Currency</label>
        <select v-model="currency" class="input-dark">
          <option value="ISK">ISK (kr.)</option>
          <option value="EUR">EUR (€)</option>
        </select>
      </div>
      <div>
        <label class="admin-label">Exchange rate (1 EUR in ISK)</label>
        <input
          v-model.number="fxRate"
          type="number"
          min="1"
          step="0.01"
          class="input-dark"
          title="Used to convert the entered prices when you switch currency"
        >
        <p class="mt-1 text-xs text-ink-400">
          {{ fxInfo }}
        </p>
      </div>
      <div>
        <label class="admin-label">VAT</label>
        <label class="flex items-center gap-2 py-2.5 text-sm text-bone-100 cursor-pointer select-none">
          <input v-model="includeVat" type="checkbox" class="accent-gold-400">
          Add {{ VAT_RATE }}% VAT
        </label>
      </div>
      <div>
        <label class="admin-label">Discount</label>
        <select v-model="discountType" class="input-dark">
          <option value="">No discount</option>
          <option value="percent">Percent (%)</option>
          <option value="fixed">Fixed amount</option>
        </select>
      </div>
      <div v-if="discountType">
        <label class="admin-label">
          {{ discountType === 'percent' ? 'Discount %' : `Discount (${currency})` }}
        </label>
        <input v-model.number="discountValue" type="number" min="0" :max="discountType === 'percent' ? 100 : undefined" step="any" class="input-dark">
      </div>
      <div class="sm:col-span-2">
        <label class="admin-label">Note on the PDF (optional)</label>
        <input v-model.trim="note" type="text" class="input-dark" placeholder="e.g. Delivery included">
      </div>
      <div>
        <label class="admin-label">Valid until (optional)</label>
        <input v-model.trim="validUntil" type="text" class="input-dark" placeholder="e.g. 1 August 2026">
      </div>
    </div>

    <!-- Totals -->
    <div class="mt-6 border-t border-ink-800 pt-4 text-sm space-y-1 text-right">
      <p class="text-bone-400">Subtotal: <span class="text-bone-100 tabular-nums">{{ fmt(subtotal) }}</span></p>
      <p v-if="discountAmount > 0" class="text-bone-400">
        Discount{{ discountType === 'percent' ? ` (${discountValue}%)` : '' }}:
        <span class="text-gold-400 tabular-nums">−{{ fmt(discountAmount) }}</span>
      </p>
      <p v-if="includeVat" class="text-bone-400">VAT ({{ VAT_RATE }}%): <span class="text-bone-100 tabular-nums">{{ fmt(vatAmount) }}</span></p>
    </div>

    <p v-if="error" class="mt-4 text-sm text-signal-400" role="alert">{{ error }}</p>
    <p v-if="notice" class="mt-4 text-sm text-emerald-400" role="status">{{ notice }}</p>

    <!-- Same sticky bar as every other editable page: the total and the two actions stay in view -->
    <div class="admin-savebar -mx-5 -mb-5 mt-5 !border-x-0 !border-b-0 sm:-mx-6 sm:-mb-6 sm:px-6">
      <button type="button" class="btn-gold" :disabled="!complete || busy !== ''" @click="send">
        {{ busy === 'send' ? 'Sending…' : 'Send offer' }}
      </button>
      <button type="button" class="btn-outline" :disabled="!complete || busy !== ''" @click="preview">
        {{ busy === 'preview' ? 'Generating…' : 'Preview PDF' }}
      </button>
      <span class="min-w-0 truncate text-xs text-ink-400">{{ complete ? `Goes to ${quote.email}` : 'Fill in a price for every item first' }}</span>
      <p class="text-sm text-bone-400 sm:ml-auto sm:text-right">
        {{ includeVat ? 'Total incl. VAT' : 'Total, no VAT' }}
        <span class="ml-2 font-heading text-xl font-semibold tabular-nums text-bone-100">{{ fmt(total) }}</span>
      </p>
      <button type="button" class="admin-link ml-auto sm:ml-4 inline-flex items-center gap-2 !text-signal-400 !decoration-signal-500/40 hover:!text-signal-500" @click="emit('delete')">
        <AdminIcon name="trash" :size="16" /> Delete quote
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { InsuranceTier, Offer, PricingMode, QuoteDetail, QuoteItem } from '~/types'
import { INSURANCE_EXCESS } from '~/data/insurance'
const { confirmDialog } = useAppDialog()

const props = defineProps<{ quote: QuoteDetail }>()

// Item · price controls · line total. The header strip and every item row share it.
// charge · option · how many / how long · unit price · row total. Two columns on a phone.
const row = 'grid-cols-2 gap-x-3 gap-y-2 md:grid-cols-[5.5rem_minmax(8.5rem,13rem)_8rem_9.5rem_minmax(5.5rem,1fr)]'
const emit = defineEmits<{ saved: [], delete: [] }>()

// Prefill from the latest offer revision so "revise & resend" starts from
// what the customer last saw.
const latest = props.quote.offers[props.quote.offers.length - 1]
const prices = reactive<Record<number, number | null>>({})
const modes = reactive<Record<number, PricingMode>>({})
// Count of days or weeks, depending on the item's mode. Weeks may be fractional.
const periods = reactive<Record<number, number | null>>({})
// Vehicle add-ons, keyed by quote item id (vehicles only).
// '' = no driver add-on · 'count' = N additional drivers (× price) · 'unlimited' = one flat add-on.
type DriverMode = '' | 'count' | 'unlimited'
interface ExtrasState {
  insTier: InsuranceTier | ''
  insPrice: number | null
  driverMode: DriverMode
  drivers: number | null
  driverPrice: number | null
  km: number | null
  kmPrice: number | null
}
const extras = reactive<Record<number, ExtrasState>>({})
const INSURANCE_TIERS: InsuranceTier[] = ['bronze', 'silver', 'gold']
const TIER_NAME: Record<InsuranceTier, string> = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold' }
// "excess 65,000 kr.": printed on the offer too, so the admin sees it while pricing
const excessText = (tier: InsuranceTier | '') => {
  const ex = tier ? INSURANCE_EXCESS[tier] : null
  return ex ? `excess ${ex.isk.toLocaleString('en-US')} kr.` : ''
}
const seedItem = (item: QuoteItem) => {
  const prev = latest?.items.find(i => i.quoteItemId === item.id)
  prices[item.id] = prev ? prev.unitPrice : null
  modes[item.id] = prev?.pricing === 'day' || prev?.pricing === 'week' ? prev.pricing : 'flat'
  periods[item.id] = prev?.pricing === 'day' ? prev.days ?? 1 : prev?.pricing === 'week' ? prev.weeks ?? 1 : null
  if (item.itemType === 'vehicle') {
    const ins = prev?.extras?.find(e => e.kind === 'insurance')
    const drv = prev?.extras?.find(e => e.kind === 'driver')
    const km = prev?.extras?.find(e => e.kind === 'km')
    extras[item.id] = {
      insTier: ins?.tier ?? '',
      insPrice: ins?.unitPrice ?? null,
      driverMode: !drv ? '' : drv.unlimited ? 'unlimited' : 'count',
      drivers: drv && !drv.unlimited ? drv.qty : null,
      driverPrice: drv?.unitPrice ?? null,
      km: km?.qty ?? null,
      kmPrice: km?.unitPrice ?? null,
    }
  }
}
props.quote.items.forEach(seedItem)
// The form stays mounted while the quote is edited, so in-progress prices
// survive qty changes; only items added by the edit need seeding.
watch(() => props.quote.items, (items) => {
  for (const item of items) if (!(item.id in modes)) seedItem(item)
})

// "1 week", "2 weeks", "1 day"
const unit = (mode: PricingMode | undefined, n: number | null | undefined) => `${mode === 'week' ? 'week' : 'day'}${n === 1 ? '' : 's'}`

// "/day", "/week" or nothing, printed after the currency inside a price field
const per = (mode: PricingMode | undefined) => mode === 'day' ? '/day' : mode === 'week' ? '/week' : ''
// The rental period an add-on is charged over, e.g. "for 12 days"
const periodText = (id: number) => needsPeriod(id) && hasPeriod(id) ? `for ${periods[id]} ${unit(modes[id], periods[id])}` : needsPeriod(id) ? 'Set the period above' : 'One price'
// An add-on row's total: the amount, or a prompt while its price is missing
const rowTotal = (n: number | null) => n == null ? 'Price missing' : n > 0 ? fmt(n) : '–'

const bulkMode = ref<PricingMode>('week')
const bulkPeriod = ref<number | null>(1)
const applyToAll = () => {
  for (const item of props.quote.items) {
    modes[item.id] = bulkMode.value
    periods[item.id] = bulkMode.value === 'flat' ? null : bulkPeriod.value
  }
}
const currency = ref<'ISK' | 'EUR'>(latest?.currency ?? 'ISK')
const discountType = ref<'' | 'percent' | 'fixed'>(latest?.discountType ?? '')
const discountValue = ref<number | null>(latest?.discountValue ?? null)
const note = ref(latest?.note ?? '')
const validUntil = ref(latest?.validUntil ?? '')

const busy = ref<'' | 'preview' | 'send'>('')
const error = ref('')
const notice = ref('')

// VAT is on by default; it can be left off (e.g. foreign productions). An
// earlier revision without VAT keeps it off when revising.
const includeVat = ref(latest ? latest.vatRate > 0 : true)

// EUR→ISK reference rate (ECB, fetched once) used to convert every entered
// price when the currency is switched. Editable so a negotiated rate can be
// used instead; a manual entry is never overwritten by the fetch.
type Currency = 'ISK' | 'EUR'
const fxRate = ref<number | null>(null)
const fxMeta = ref<{ date: string, source: 'ecb' | 'fallback' } | null>(null)
const fxInfo = computed(() => {
  const how = 'Switching to EUR converts the prices; switching back restores the ISK prices you typed.'
  if (!fxMeta.value) return how
  return fxMeta.value.source === 'ecb'
    ? `ECB reference rate from ${fxMeta.value.date}. ${how}`
    : `Live rate unavailable; this is an estimate. ${how}`
})
onMounted(async () => {
  try {
    const r = await $fetch<{ eurIsk: number, date: string, source: 'ecb' | 'fallback' }>('/api/admin/fx')
    if (fxRate.value == null) fxRate.value = r.eurIsk
    fxMeta.value = { date: r.date, source: r.source }
  }
  catch {
    // Leave the field empty; the admin can type a rate by hand.
  }
})
const convert = (n: number | null, from: Currency, to: Currency): number | null => {
  const rate = fxRate.value
  if (n == null || !Number.isFinite(n) || !rate || rate <= 0) return n
  // EUR figures are kept whole; cents on a rental quote only look like noise.
  if (from === 'ISK' && to === 'EUR') return Math.round(n / rate)
  if (from === 'EUR' && to === 'ISK') return Math.round(n * rate)
  return n
}
// The ISK figures the admin typed are the reference. Leaving ISK stores them;
// coming back restores them instead of re-converting the EUR figures, so a
// EUR tweak (or rounding) never drifts the ISK price. Fields that were empty
// in ISK and filled in while in EUR are converted back as before.
interface IskSnapshot {
  prices: Record<number, number | null>
  extras: Record<number, { insPrice: number | null, driverPrice: number | null, kmPrice: number | null }>
  discount: number | null
}
let iskSnapshot: IskSnapshot | null = null
watch(currency, (to, from) => {
  if (to === from) return
  if (!fxRate.value || fxRate.value <= 0) {
    notice.value = 'No exchange rate set, so the prices were left as they are.'
    return
  }
  if (from === 'ISK') {
    iskSnapshot = {
      prices: Object.fromEntries(props.quote.items.map(i => [i.id, prices[i.id] ?? null])),
      extras: Object.fromEntries(props.quote.items.flatMap((i) => {
        const e = extras[i.id]
        return e ? [[i.id, { insPrice: e.insPrice, driverPrice: e.driverPrice, kmPrice: e.kmPrice }]] : []
      })),
      discount: discountType.value === 'fixed' ? discountValue.value : null,
    }
  }
  const restoring = to === 'ISK' && iskSnapshot != null
  const back = (saved: number | null | undefined, current: number | null) =>
    restoring && saved != null ? saved : convert(current, from, to)
  for (const item of props.quote.items) {
    prices[item.id] = back(iskSnapshot?.prices[item.id], prices[item.id] ?? null)
    const e = extras[item.id]
    if (e) {
      const saved = iskSnapshot?.extras[item.id]
      e.insPrice = back(saved?.insPrice, e.insPrice)
      e.driverPrice = back(saved?.driverPrice, e.driverPrice)
      e.kmPrice = back(saved?.kmPrice, e.kmPrice)
    }
  }
  if (discountType.value === 'fixed') discountValue.value = back(iskSnapshot?.discount, discountValue.value)
  error.value = ''
  notice.value = restoring
    ? 'Back to ISK: the ISK prices you typed are restored.'
    : `Prices converted from ${from} to ${to} at 1 EUR = ${fxRate.value} ISK.`
})

const needsPeriod = (id: number) => modes[id] === 'day' || modes[id] === 'week'
const isPriced = (id: number) => typeof prices[id] === 'number' && Number.isFinite(prices[id]!) && prices[id]! >= 0
const round2 = (n: number) => Math.round(n * 100) / 100
// Mirrors the server: whole days, weeks to two decimals (1.5 weeks etc.).
const periodCount = (id: number) =>
  modes[id] === 'day' ? Math.round(periods[id]!) : modes[id] === 'week' ? round2(periods[id]!) : 1
const hasPeriod = (id: number) => !needsPeriod(id)
  || (typeof periods[id] === 'number' && Number.isFinite(periods[id]!)
    && (modes[id] === 'week' ? periods[id]! > 0 : periods[id]! >= 1))
const lineTotal = (item: QuoteItem): number | null => {
  if (!isPriced(item.id) || !hasPeriod(item.id)) return null
  return prices[item.id]! * item.qty * periodCount(item.id)
}
const pricePlaceholder = (id: number) =>
  modes[id] === 'day' ? 'Price / day' : modes[id] === 'week' ? 'Price / week' : 'Price / unit'

// Extras mirror the server: insurance per vehicle (× qty) and drivers are
// charged over the vehicle's period; km is km × rate. Unlimited drivers is
// per vehicle (× qty), like insurance.
const isNum = (n: number | null | undefined): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0
const unlimitedDrivers = (id: number) => extras[id]?.driverMode === 'unlimited'
const hasDrivers = (id: number) => !!extras[id]?.driverMode
const hasKm = (id: number) => (extras[id]?.km ?? 0) > 0
const extraPeriod = (id: number) => hasPeriod(id) ? periodCount(id) : 0
const insuranceTotal = (item: QuoteItem): number | null => {
  const e = extras[item.id]
  if (!e?.insTier) return 0
  return isNum(e.insPrice) ? e.insPrice * item.qty * extraPeriod(item.id) : null
}
const driverTotal = (item: QuoteItem): number | null => {
  const e = extras[item.id]
  if (!e || !hasDrivers(item.id)) return 0
  if (!unlimitedDrivers(item.id) && !(isNum(e.drivers) && e.drivers >= 1)) return null
  const count = unlimitedDrivers(item.id) ? item.qty : Math.round(e.drivers!)
  return isNum(e.driverPrice) ? e.driverPrice * count * extraPeriod(item.id) : null
}
const kmTotal = (item: QuoteItem): number | null => {
  const e = extras[item.id]
  if (!e || !hasKm(item.id)) return 0
  return isNum(e.kmPrice) ? e.kmPrice * round2(e.km!) : null
}
const extrasTotal = (item: QuoteItem) =>
  item.itemType === 'vehicle' ? (insuranceTotal(item) ?? 0) + (driverTotal(item) ?? 0) + (kmTotal(item) ?? 0) : 0
const extrasComplete = (item: QuoteItem) => item.itemType !== 'vehicle'
  || (insuranceTotal(item) != null && driverTotal(item) != null && kmTotal(item) != null
    && (!hasDrivers(item.id) || unlimitedDrivers(item.id) || Number.isInteger(extras[item.id]!.drivers)))
const extraPlaceholder = (id: number) =>
  modes[id] === 'day' ? 'Price / day' : modes[id] === 'week' ? 'Price / week' : 'Price'

const complete = computed(() => props.quote.items.every(i => isPriced(i.id) && hasPeriod(i.id) && extrasComplete(i)))

const subtotal = computed(() =>
  props.quote.items.reduce((sum, i) => sum + (lineTotal(i) ?? 0) + extrasTotal(i), 0))
const discountAmount = computed(() => {
  const v = discountValue.value
  if (!discountType.value || !v || v <= 0) return 0
  return discountType.value === 'percent'
    ? subtotal.value * Math.min(v, 100) / 100
    : Math.min(v, subtotal.value)
})
// Mirrors the server (quoteStore.createOffer): VAT on the net amount, or none.
const VAT_RATE = 24
const vatAmount = computed(() => includeVat.value ? (subtotal.value - discountAmount.value) * VAT_RATE / 100 : 0)
const total = computed(() => subtotal.value - discountAmount.value + vatAmount.value)

const fmt = (n: number) => currency.value === 'EUR'
  ? `€${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
  : `${Math.round(n).toLocaleString('is-IS')} kr.`

// The offer PDF prints every line at its price after the discount, so the
// form shows the same figures while pricing. The discount is spread over the
// lines and add-ons in proportion (server/utils/offerDiscount.ts); the PDF may
// differ by a króna where it carries the rounding from one line to the next.
const netFactor = computed(() => subtotal.value > 0 ? (subtotal.value - discountAmount.value) / subtotal.value : 1)
// A króna rate under 1,000 kr. keeps its aurar, as on the PDF (45 kr./km less 10% is 40.5).
const fmtRate = (n: number) => {
  const v = round2(n)
  return currency.value === 'ISK' && v < 1000 && !Number.isInteger(v)
    ? `${v.toLocaleString('is-IS', { maximumFractionDigits: 2 })} kr.`
    : fmt(v)
}
// Lines under a row total: the total after the discount, then the unit price
// after it unless that is the same figure (a single flat-priced unit).
const discountNotes = (rowAmount: number | null, rate: number | null | undefined, suffix: string): string[] => {
  if (!(discountAmount.value > 0) || rowAmount == null || !(rowAmount > 0)) return []
  return [
    `${fmt(rowAmount * netFactor.value)} after discount`,
    ...(isNum(rate) && rate !== rowAmount ? [`${fmtRate(rate * netFactor.value)}${suffix}`] : []),
  ]
}

const extrasPayload = (id: number) => {
  const e = extras[id]
  if (!e) return undefined
  return [
    ...(e.insTier ? [{ kind: 'insurance' as const, tier: e.insTier, unitPrice: e.insPrice! }] : []),
    ...(hasDrivers(id)
      ? [unlimitedDrivers(id)
          ? { kind: 'driver' as const, unlimited: true, unitPrice: e.driverPrice! }
          : { kind: 'driver' as const, qty: e.drivers!, unitPrice: e.driverPrice! }]
      : []),
    ...(hasKm(id) ? [{ kind: 'km' as const, qty: e.km!, unitPrice: e.kmPrice! }] : []),
  ]
}

const payload = (send: boolean) => ({
  send,
  currency: currency.value,
  vat: includeVat.value,
  discountType: discountType.value || undefined,
  discountValue: discountType.value ? discountValue.value : undefined,
  note: note.value || undefined,
  validUntil: validUntil.value || undefined,
  items: props.quote.items.map(i => ({
    quoteItemId: i.id,
    unitPrice: prices[i.id]!,
    pricing: modes[i.id],
    days: modes[i.id] === 'day' ? periodCount(i.id) : undefined,
    weeks: modes[i.id] === 'week' ? periodCount(i.id) : undefined,
    extras: i.itemType === 'vehicle' ? extrasPayload(i.id) : undefined,
  })),
})

const preview = async () => {
  busy.value = 'preview'
  error.value = ''
  notice.value = ''
  try {
    const res = await $fetch<{ offer: Offer }>(`/api/admin/quotes/${props.quote.id}/offer`, {
      method: 'POST',
      body: payload(false),
    })
    window.open(`/api/admin/quotes/${props.quote.id}/offers/${res.offer.id}`, '_blank')
    emit('saved')
  }
  catch (e: any) {
    error.value = e?.data?.data?.errors?.join(' ') || e?.data?.statusMessage || 'Could not generate the PDF.'
  }
  finally {
    busy.value = ''
  }
}

const send = async () => {
  if (!await confirmDialog(`Send this offer (${fmt(total.value)}) to ${props.quote.email}?`)) return
  busy.value = 'send'
  error.value = ''
  notice.value = ''
  try {
    await $fetch(`/api/admin/quotes/${props.quote.id}/offer`, {
      method: 'POST',
      body: payload(true),
    })
    notice.value = `Offer sent to ${props.quote.email}.`
    emit('saved')
  }
  catch (e: any) {
    error.value = e?.data?.data?.errors?.join(' ') || e?.data?.statusMessage || 'Sending failed. The offer was saved, so fix the issue and resend.'
    emit('saved')
  }
  finally {
    busy.value = ''
  }
}

const currencySuffix = computed(() => currency.value === 'EUR' ? '€' : 'kr.')
</script>
