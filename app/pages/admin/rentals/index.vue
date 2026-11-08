<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="kicker">Rentals</p>
        <h1 class="mt-2 text-3xl font-semibold uppercase tracking-wide text-bone-100">Confirmed rentals</h1>
      </div>
      <NuxtLink to="/admin/quotes" class="btn-ghost !px-4 !py-2 !text-xs">Quotes →</NuxtLink>
    </div>

    <p v-if="loadError" class="mt-8 text-sm text-signal-500">{{ loadError }}</p>
    <p v-else-if="!data" class="mt-8 text-sm text-bone-400">Loading rental statistics…</p>

    <template v-else>
      <!-- Totals -->
      <dl class="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-px bg-ink-800 border border-ink-800">
        <div class="bg-ink-900/70 p-4">
          <dt class="text-xs uppercase tracking-widest text-bone-400">Confirmed offers</dt>
          <dd class="mt-1 text-2xl font-semibold text-bone-100 tabular-nums">{{ data.summary.confirmedOffers }}</dd>
        </div>
        <div class="bg-ink-900/70 p-4">
          <dt class="text-xs uppercase tracking-widest text-bone-400">Gross (before discount)</dt>
          <dd class="mt-1 text-bone-100 tabular-nums"><AdminRentalMoney :amounts="data.summary.gross" class="!items-start" /></dd>
        </div>
        <div class="bg-ink-900/70 p-4">
          <dt class="text-xs uppercase tracking-widest text-bone-400">Net of discounts</dt>
          <dd class="mt-1 text-bone-100 tabular-nums"><AdminRentalMoney :amounts="data.summary.net" class="!items-start" /></dd>
        </div>
        <div class="bg-ink-900/70 p-4">
          <dt class="text-xs uppercase tracking-widest text-bone-400">Invoiced incl. VAT</dt>
          <dd class="mt-1 text-bone-100 tabular-nums"><AdminRentalMoney :amounts="data.summary.total" class="!items-start" /></dd>
        </div>
      </dl>

      <!-- Filters -->
      <div class="mt-8 flex flex-wrap items-center gap-3">
        <div class="flex gap-2">
          <button
            v-for="t in typeOptions"
            :key="t.value"
            type="button"
            class="text-[10px] uppercase tracking-widest px-2.5 py-1.5 border transition-colors"
            :class="typeFilter === t.value ? 'text-gold-400 border-gold-500/60' : 'text-bone-400 border-ink-700 hover:border-bone-400/50'"
            @click="typeFilter = t.value"
          >
            {{ t.label }}
          </button>
        </div>
        <input
          v-model.trim="search"
          type="search"
          class="input-dark !w-auto flex-1 min-w-[12rem] !py-1.5 !text-sm"
          placeholder="Search items…"
        >
        <select v-model="sortBy" class="input-dark !w-auto !py-1.5 !text-sm">
          <option value="times">Most rented</option>
          <option value="gross">Highest gross</option>
          <option value="recent">Most recent</option>
          <option value="name">Name</option>
        </select>
      </div>

      <!-- Item table -->
      <div class="mt-5 border border-ink-800 divide-y divide-ink-800">
        <div class="hidden sm:grid grid-cols-[1fr_6rem_6rem_8rem_8rem] gap-4 px-4 py-2 text-[10px] uppercase tracking-widest text-bone-400 bg-ink-900">
          <span>Item</span>
          <span class="text-right">Rented</span>
          <span class="text-right">Units · days</span>
          <span class="text-right">Gross</span>
          <span class="text-right">Net</span>
        </div>

        <template v-for="item in visible" :key="item.key">
          <button
            type="button"
            class="w-full grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_6rem_6rem_8rem_8rem] gap-x-4 gap-y-1 items-center px-4 py-3 text-left text-sm bg-ink-900/50 hover:bg-ink-900 transition-colors"
            @click="toggle(item.key)"
          >
            <div class="flex items-center gap-3 min-w-0">
              <img
                v-if="item.image"
                :src="item.image"
                :alt="item.name.en"
                class="w-14 h-10 object-cover bg-ink-800 shrink-0"
                loading="lazy"
              >
              <div v-else class="w-14 h-10 bg-ink-800 shrink-0" />
              <div class="min-w-0">
                <p class="font-semibold text-bone-100 truncate">
                  {{ item.name.en }}
                  <span v-if="!item.inCatalogue" class="ml-1 text-[10px] uppercase tracking-widest text-bone-400 font-normal">· removed</span>
                </p>
                <p class="mt-0.5 text-xs uppercase tracking-widest text-bone-400">
                  {{ item.itemType }}
                  <span v-if="item.lastRentedAt" class="normal-case tracking-normal"> · last {{ formatDate(item.lastRentedAt) }}</span>
                </p>
              </div>
            </div>
            <p class="text-right tabular-nums text-bone-100 font-semibold">{{ item.timesRented }}<span class="sm:hidden text-bone-400 font-normal text-xs"> rented</span></p>
            <p class="hidden sm:block text-right tabular-nums text-bone-400">{{ item.unitsRented }} · {{ item.rentalDays || '–' }}</p>
            <p class="hidden sm:block text-right tabular-nums text-bone-100"><AdminRentalMoney :amounts="item.gross" /></p>
            <p class="hidden sm:block text-right tabular-nums text-bone-400"><AdminRentalMoney :amounts="item.net" /></p>
            <p class="sm:hidden col-span-2 text-xs text-bone-400 tabular-nums">
              {{ item.unitsRented }} units · {{ item.rentalDays || '–' }} days · gross <AdminRentalMoney :amounts="item.gross" class="!inline-flex !flex-row gap-2" />
            </p>
          </button>
          <div v-if="open.has(item.key)" class="px-4 pb-4 bg-ink-900/50">
            <div class="flex items-center justify-between gap-3 pt-1 pb-3">
              <p class="text-[10px] uppercase tracking-widest text-bone-400">Rentals · {{ item.rentals.length }}</p>
              <NuxtLink
                v-if="item.inCatalogue && item.itemType !== 'service'"
                :to="item.itemType === 'vehicle' ? `/admin/vehicles/${item.itemId}` : `/admin/equipment/${item.itemId}`"
                class="text-xs text-bone-400 hover:text-gold-400 transition-colors"
              >Edit item →</NuxtLink>
            </div>
            <AdminRentalHistory :rentals="item.rentals" />
          </div>
        </template>

        <p v-if="!visible.length" class="p-8 text-center text-sm text-bone-400">
          <template v-if="!data.items.length">
            No confirmed rentals yet. Open a quote, and under “Offer history” mark the offer the customer accepted as confirmed.
          </template>
          <template v-else>No items match.</template>
        </p>
      </div>

      <p class="mt-4 text-xs text-bone-400 leading-relaxed">
        Gross is each offer line incl. vehicle extras, before discount and VAT. Net spreads the offer discount over its lines.
        ISK and EUR offers are listed separately because the exchange rate is not stored with the offer.
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { CartItemType, ItemRentalStats, RentalStatsSummary } from '~/types'

definePageMeta({ layout: 'admin' })

interface StatsResponse { summary: RentalStatsSummary, items: ItemRentalStats[] }

const data = ref<StatsResponse | null>(null)
const loadError = ref('')

onMounted(async () => {
  try {
    data.value = await $fetch<StatsResponse>('/api/admin/rental-stats', { query: { t: Date.now() } })
  }
  catch {
    loadError.value = 'Could not load rental statistics. Is the server running?'
  }
})

type TypeFilter = CartItemType | 'all'
const typeOptions: { value: TypeFilter, label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'vehicle', label: 'Vehicles' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'service', label: 'Services' },
]
const typeFilter = ref<TypeFilter>('all')
const search = ref('')
const sortBy = ref<'times' | 'gross' | 'recent' | 'name'>('times')
const open = ref(new Set<string>())

const toggle = (key: string) => {
  const next = new Set(open.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  open.value = next
}

const visible = computed(() => {
  if (!data.value) return []
  const q = search.value.toLowerCase()
  const list = data.value.items.filter(i =>
    (typeFilter.value === 'all' || i.itemType === typeFilter.value)
    && (!q || i.name.en.toLowerCase().includes(q) || i.name.is.toLowerCase().includes(q)))
  const sorters: Record<typeof sortBy.value, (a: ItemRentalStats, b: ItemRentalStats) => number> = {
    times: (a, b) => b.timesRented - a.timesRented || b.gross.ISK - a.gross.ISK || b.gross.EUR - a.gross.EUR,
    gross: (a, b) => b.gross.ISK - a.gross.ISK || b.gross.EUR - a.gross.EUR,
    recent: (a, b) => (b.lastRentedAt ?? '').localeCompare(a.lastRentedAt ?? ''),
    name: (a, b) => a.name.en.localeCompare(b.name.en),
  }
  return [...list].sort(sorters[sortBy.value])
})

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

useHead({ title: 'Rentals · Admin · Creative Filmmaking' })
</script>
