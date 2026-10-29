<template>
  <div class="border border-ink-800 bg-ink-900/50 p-5">
    <!-- Apply pricing to every item at once -->
    <div class="mb-2 flex flex-wrap items-center justify-end gap-2 border-b border-ink-800 pb-4">
      <span class="mr-auto text-xs uppercase tracking-widest text-bone-400">Apply to all items</span>
      <select v-model="bulkMode" class="input-dark !w-28">
        <option value="flat">Flat price</option>
        <option value="day">Per day</option>
        <option value="week">Per week</option>
      </select>
      <input
        v-if="bulkMode === 'day' || bulkMode === 'week'"
        v-model.number="bulkPeriod"
        type="number"
        :min="bulkMode === 'week' ? 0.5 : 1"
        max="999"
        :step="bulkMode === 'week' ? 0.5 : 1"
        class="input-dark !w-20 text-right"
        :placeholder="bulkMode === 'week' ? 'Weeks' : 'Days'"
        :title="bulkMode === 'week' ? 'Number of weeks (e.g. 1.5)' : 'Number of days'"
      >
      <button type="button" class="btn-ghost !px-4 !py-2 !text-xs" @click="applyToAll">
        Apply
      </button>
    </div>

    <!-- Item pricing -->
    <div class="divide-y divide-ink-800">
      <div v-for="item in quote.items" :key="item.id" class="py-3">
        <div class="flex items-center gap-4">
          <img
            v-if="item.image"
            :src="item.image"
            :alt="item.name.en"
            class="w-20 h-14 object-cover bg-ink-800 shrink-0"
            loading="lazy"
          >
          <div v-else class="w-20 h-14 bg-ink-800 shrink-0" />
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-bone-100 truncate">{{ item.name.en }}</p>
            <p v-if="item.note" class="mt-0.5 text-sm text-bone-300 truncate" :title="item.note">{{ item.note }}</p>
            <p class="mt-0.5 text-xs uppercase tracking-widest text-bone-400">
              {{ item.itemType }}<span v-if="item.qty > 1"> · qty {{ item.qty }}</span>
            </p>
          </div>
          <div class="flex items-center gap-2 flex-wrap justify-end">
            <select v-model="modes[item.id]" class="input-dark !w-28">
              <option value="flat">Flat price</option>
              <option value="day">Per day</option>
              <option value="week">Per week</option>
            </select>
            <input
              v-model.number="prices[item.id]"
              type="number"
              min="0"
              step="any"
              class="input-dark !w-32 text-right"
              :placeholder="pricePlaceholder(item.id)"
            >
            <input
              v-if="modes[item.id] === 'day' || modes[item.id] === 'week'"
              v-model.number="periods[item.id]"
              type="number"
              :min="modes[item.id] === 'week' ? 0.5 : 1"
              max="999"
              :step="modes[item.id] === 'week' ? 0.5 : 1"
              class="input-dark !w-20 text-right"
              :placeholder="modes[item.id] === 'week' ? 'Weeks' : 'Days'"
              :title="modes[item.id] === 'week' ? 'Number of weeks (e.g. 1.5)' : 'Number of days'"
            >
            <span class="text-xs text-bone-400 w-24 text-right">
              {{ lineTotal(item) != null ? `= ${fmt(lineTotal(item)!)}` : currencySuffix }}
            </span>
          </div>
        </div>

        <!-- Vehicle extras: insurance & drivers follow the vehicle's period, km is km × rate -->
        <div v-if="item.itemType === 'vehicle' && extras[item.id]" class="mt-3 sm:ml-24 grid gap-2 border-l border-ink-800 pl-4">
          <div class="flex flex-wrap items-center justify-end gap-2">
            <span class="mr-auto text-xs uppercase tracking-widest text-bone-400">Insurance</span>
            <select v-model="extras[item.id]!.insTier" class="input-dark !w-32">
              <option value="">None</option>
              <option v-for="t in INSURANCE_TIERS" :key="t" :value="t">{{ TIER_LABEL[t] }}</option>
            </select>
            <input
              v-if="extras[item.id]!.insTier"
              v-model.number="extras[item.id]!.insPrice"
              type="number"
              min="0"
              step="any"
              class="input-dark !w-32 text-right"
              :placeholder="extraPlaceholder(item.id)"
              :title="item.qty > 1 ? `Per vehicle, multiplied by qty ${item.qty}` : undefined"
            >
            <span class="text-xs text-bone-400 w-24 text-right">{{ extraLabel(insuranceTotal(item)) }}</span>
          </div>
          <div class="flex flex-wrap items-center justify-end gap-2">
            <span class="mr-auto text-xs uppercase tracking-widest text-bone-400">Drivers</span>
            <select v-model="extras[item.id]!.driverMode" class="input-dark !w-32">
              <option value="">None</option>
              <option value="count">Additional</option>
              <option value="unlimited">Unlimited</option>
            </select>
            <input
              v-if="extras[item.id]!.driverMode === 'count'"
              v-model.number="extras[item.id]!.drivers"
              type="number"
              min="1"
              max="99"
              step="1"
              class="input-dark !w-20 text-right"
              placeholder="1"
              title="Number of additional drivers"
            >
            <input
              v-if="extras[item.id]!.driverMode"
              v-model.number="extras[item.id]!.driverPrice"
              type="number"
              min="0"
              step="any"
              class="input-dark !w-32 text-right"
              :placeholder="unlimitedDrivers(item.id) ? extraPlaceholder(item.id) : `${extraPlaceholder(item.id)} / driver`"
              :title="unlimitedDrivers(item.id)
                ? (item.qty > 1 ? `Unlimited drivers per vehicle, multiplied by qty ${item.qty}` : 'Price for unlimited authorised drivers')
                : undefined"
            >
            <span class="text-xs text-bone-400 w-24 text-right">{{ extraLabel(driverTotal(item)) }}</span>
          </div>
          <div class="flex flex-wrap items-center justify-end gap-2">
            <span class="mr-auto text-xs uppercase tracking-widest text-bone-400">KM</span>
            <input
              v-model.number="extras[item.id]!.km"
              type="number"
              min="0"
              step="any"
              class="input-dark !w-24 text-right"
              placeholder="km"
              title="Number of kilometres"
            >
            <input
              v-if="(extras[item.id]!.km ?? 0) > 0"
              v-model.number="extras[item.id]!.kmPrice"
              type="number"
              min="0"
              step="any"
              class="input-dark !w-32 text-right"
              placeholder="Price / km"
            >
            <span class="text-xs text-bone-400 w-24 text-right">{{ extraLabel(kmTotal(item)) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Discount / currency / note -->
    <div class="mt-5 grid gap-5 sm:grid-cols-3">
      <div>
        <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">Currency</label>
        <select v-model="currency" class="input-dark">
          <option value="ISK">ISK (kr.)</option>
          <option value="EUR">EUR (€)</option>
        </select>
      </div>
      <div>
        <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">Exchange rate (1 EUR in ISK)</label>
        <input
          v-model.number="fxRate"
          type="number"
          min="1"
          step="0.01"
          class="input-dark"
          title="Used to convert the entered prices when you switch currency"
        >
        <p class="mt-1 text-[11px] text-bone-400">
          {{ fxInfo }}
        </p>
      </div>
      <div>
        <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">VAT</label>
        <label class="flex items-center gap-2 py-2.5 text-sm text-bone-100 cursor-pointer select-none">
          <input v-model="includeVat" type="checkbox" class="accent-gold-400">
          Add {{ VAT_RATE }}% VAT
        </label>
      </div>
      <div>
        <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">Discount</label>
        <select v-model="discountType" class="input-dark">
          <option value="">No discount</option>
          <option value="percent">Percent (%)</option>
          <option value="fixed">Fixed amount</option>
        </select>
      </div>
      <div v-if="discountType">
        <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">
          {{ discountType === 'percent' ? 'Discount %' : `Discount (${currency})` }}
        </label>
        <input v-model.number="discountValue" type="number" min="0" :max="discountType === 'percent' ? 100 : undefined" step="any" class="input-dark">
      </div>
      <div class="sm:col-span-2">
        <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">Note on the PDF (optional)</label>
        <input v-model.trim="note" type="text" class="input-dark" placeholder="e.g. Includes delivery within the capital area.">
      </div>
      <div>
        <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">Valid until (optional)</label>
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
      <p class="text-lg font-semibold text-bone-100">{{ includeVat ? 'Total incl. VAT' : 'Total (no VAT)' }}: <span class="tabular-nums">{{ fmt(total) }}</span></p>
    </div>

    <p v-if="error" class="mt-4 text-sm text-signal-500">{{ error }}</p>
    <p v-if="notice" class="mt-4 text-sm text-emerald-400">{{ notice }}</p>

    <div class="mt-6 flex flex-wrap gap-3 justify-end">
      <button
        type="button"
        class="btn-ghost !text-xs disabled:opacity-50"
        :disabled="!complete || busy !== ''"
        @click="preview"
      >
        {{ busy === 'preview' ? 'Generating…' : 'Preview PDF' }}
      </button>
      <button
        type="button"
        class="btn-gold !px-5 !py-2.5 disabled:opacity-50"
        :disabled="!complete || busy !== ''"
        @click="send"
      >
        {{ busy === 'send' ? 'Sending…' : `Send offer to ${quote.email}` }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { InsuranceTier, Offer, PricingMode, QuoteDetail, QuoteItem } from '~/types'
const { confirmDialog } = useAppDialog()

const props = defineProps<{ quote: QuoteDetail }>()
const emit = defineEmits<{ saved: [] }>()

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
const TIER_LABEL: Record<InsuranceTier, string> = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold' }
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
  if (!fxMeta.value) return 'Switching currency converts the prices at this rate.'
  return fxMeta.value.source === 'ecb'
    ? `ECB reference rate from ${fxMeta.value.date}. Switching currency converts the prices.`
    : 'Live rate unavailable; this is an estimate. Switching currency converts the prices.'
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
  if (from === 'ISK' && to === 'EUR') return Math.round(n / rate * 100) / 100
  if (from === 'EUR' && to === 'ISK') return Math.round(n * rate)
  return n
}
watch(currency, (to, from) => {
  if (to === from) return
  if (!fxRate.value || fxRate.value <= 0) {
    notice.value = 'No exchange rate set, so the prices were left as they are.'
    return
  }
  for (const item of props.quote.items) {
    prices[item.id] = convert(prices[item.id] ?? null, from, to)
    const e = extras[item.id]
    if (e) {
      e.insPrice = convert(e.insPrice, from, to)
      e.driverPrice = convert(e.driverPrice, from, to)
      e.kmPrice = convert(e.kmPrice, from, to)
    }
  }
  if (discountType.value === 'fixed') discountValue.value = convert(discountValue.value, from, to)
  error.value = ''
  notice.value = `Prices converted from ${from} to ${to} at 1 EUR = ${fxRate.value} ISK.`
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
const extraLabel = (n: number | null) => n == null ? currencySuffix.value : n > 0 ? `+ ${fmt(n)}` : ''

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
