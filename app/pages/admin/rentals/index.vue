<template>
  <div>
    <AdminPageHeader
      title="Rental stats"
      description="What has been rented, counted from the offers you marked as confirmed."
      :crumbs="[{ label: 'Sales' }, { label: 'Rental stats' }]"
    />

    <AdminStateMessage v-if="loadError" kind="error" class="mt-6">{{ loadError }}</AdminStateMessage>
    <AdminStateMessage v-else-if="!data" kind="loading" class="mt-6">Loading rental statistics…</AdminStateMessage>

    <template v-else>
      <!-- Totals -->
      <dl class="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div class="admin-card p-4">
          <dt class="admin-eyebrow">Confirmed offers</dt>
          <dd class="mt-3 font-heading text-2xl font-semibold text-bone-100 tabular-nums">{{ data.summary.confirmedOffers }}</dd>
        </div>
        <div class="admin-card p-4">
          <dt class="admin-eyebrow">Gross, before discount</dt>
          <dd class="mt-3 font-heading text-2xl font-semibold text-bone-100 tabular-nums"><AdminRentalMoney :amounts="data.summary.gross" class="!items-start" /></dd>
        </div>
        <div class="admin-card p-4">
          <dt class="admin-eyebrow">Net of discounts</dt>
          <dd class="mt-3 font-heading text-2xl font-semibold text-bone-100 tabular-nums"><AdminRentalMoney :amounts="data.summary.net" class="!items-start" /></dd>
        </div>
        <div class="admin-card p-4">
          <dt class="admin-eyebrow">Invoiced incl. VAT</dt>
          <dd class="mt-3 font-heading text-2xl font-semibold text-bone-100 tabular-nums"><AdminRentalMoney :amounts="data.summary.total" class="!items-start" /></dd>
        </div>
      </dl>

      <AdminStateMessage v-if="!data.items.length" title="No confirmed rentals yet" class="mt-6">
        Open a quote, and under “Offer history” mark the offer the customer accepted as confirmed.
        <template #action>
          <NuxtLink to="/admin/quotes" class="btn-outline btn-sm">Go to quotes</NuxtLink>
        </template>
      </AdminStateMessage>

      <template v-else>
      <!-- Filters -->
      <AdminToolbar v-model:search="search" class="mt-8" placeholder="Search items…" :count="`${visible.length} ${visible.length === 1 ? 'item' : 'items'}`">
        <button
          v-for="t in typeOptions"
          :key="t.value"
          type="button"
          class="admin-pill"
          :class="{ 'admin-pill-active': typeFilter === t.value }"
          :aria-pressed="typeFilter === t.value"
          @click="typeFilter = t.value"
        >
          {{ t.label }}
        </button>
        <template #end>
          <label class="flex items-center gap-2 text-xs text-ink-400">
            Sort
            <select v-model="sortBy" class="admin-field">
              <option value="times">Most rented</option>
              <option value="gross">Highest gross</option>
              <option value="recent">Most recent</option>
              <option value="name">Name</option>
            </select>
          </label>
        </template>
      </AdminToolbar>

      <!-- Item table -->
      <div class="admin-list mt-4">
        <div class="admin-list-head hidden sm:grid grid-cols-[1fr_6rem_6rem_8rem_8rem] gap-4">
          <span>Item</span>
          <span class="text-right">Rented</span>
          <span class="text-right">Units · days</span>
          <span class="text-right">Gross</span>
          <span class="text-right">Net</span>
        </div>

        <template v-for="item in visible" :key="item.key">
          <button
            type="button"
            class="w-full grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_6rem_6rem_8rem_8rem] gap-x-4 gap-y-1 items-center px-4 py-3 text-left text-sm hover:bg-ink-800/60 transition-colors"
            :aria-expanded="open.has(item.key)"
            @click="toggle(item.key)"
          >
            <div class="flex items-center gap-3 min-w-0">
              <AdminIcon :name="open.has(item.key) ? 'down' : 'right'" :size="16" class="text-ink-400" />
              <AdminThumb :src="item.image" :alt="item.name.en" size="sm" :icon="item.itemType === 'vehicle' ? 'vehicles' : 'equipment'" />
              <div class="min-w-0">
                <p class="font-semibold text-bone-100 truncate">
                  {{ item.name.en }}
                  <span v-if="!item.inCatalogue" class="admin-chip ml-1 border-ink-700 text-bone-400">Removed</span>
                </p>
                <p class="mt-0.5 text-xs text-ink-400">
                  <span class="capitalize">{{ item.itemType }}</span>
                  <span v-if="item.lastRentedAt"> · last {{ formatDate(item.lastRentedAt) }}</span>
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
          <div v-if="open.has(item.key)" class="px-4 pb-4 pt-1 bg-ink-950/40">
            <div class="flex items-center justify-between gap-3 py-3">
              <p class="admin-eyebrow">Rentals · {{ item.rentals.length }}</p>
              <NuxtLink
                v-if="item.inCatalogue && item.itemType !== 'service'"
                :to="item.itemType === 'vehicle' ? `/admin/vehicles/${item.itemId}` : `/admin/equipment/${item.itemId}`"
                class="admin-link"
              >Edit item</NuxtLink>
            </div>
            <AdminRentalHistory :rentals="item.rentals" />
          </div>
        </template>

        <p v-if="!visible.length" class="px-4 py-10 text-center text-sm text-bone-400">
          No items match.
          <button type="button" class="text-gold-400 hover:text-gold-500" @click="search = ''; typeFilter = 'all'">Clear filters</button>
        </p>
      </div>

      <p class="mt-4 max-w-3xl text-xs text-ink-400 leading-relaxed">
        Gross is each offer line incl. vehicle extras, before discount and VAT. Net spreads the offer discount over its lines.
        ISK and EUR offers are listed separately because the exchange rate is not stored with the offer.
      </p>
      </template>
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

useHead({ title: 'Rental stats · Admin · Creative Filmmaking' })
</script>
