<template>
  <div>
    <AdminPageHeader title="Overview" description="Where things stand with quotes and rentals today.">
      <template #actions>
        <NuxtLink to="/admin/quotes/new" class="btn-gold btn-sm"><AdminIcon name="plus" :size="16" /> New quote</NuxtLink>
      </template>
    </AdminPageHeader>

    <AdminStateMessage v-if="loadError" kind="error" class="mt-6">{{ loadError }}</AdminStateMessage>
    <AdminStateMessage v-else-if="!data" kind="loading" class="mt-6">Loading…</AdminStateMessage>

    <template v-else>
      <!-- The sales pipeline, left to right. Each tile opens the matching list. -->
      <ul class="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <li v-for="t in tiles" :key="t.label">
          <NuxtLink :to="t.to" class="admin-card group flex h-full flex-col p-4 transition-colors hover:border-ink-500 hover:bg-ink-800/60" :class="{ '!border-gold-500/60 !bg-gold-500/5': t.highlight }">
            <span class="admin-eyebrow" :class="{ '!text-gold-400': t.highlight }">{{ t.label }}</span>
            <span class="mt-2 font-heading text-3xl font-semibold tabular-nums" :class="t.value ? 'text-bone-100' : 'text-ink-400'">{{ t.value }}</span>
            <span class="mt-1 flex items-center justify-between gap-2 text-xs text-bone-400">
              {{ t.hint }}
              <AdminIcon name="right" :size="14" class="text-ink-500 transition-colors group-hover:text-gold-400" />
            </span>
          </NuxtLink>
        </li>
      </ul>

      <div class="mt-8 grid gap-8 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <!-- Open quotes: new first, then offers waiting on the customer -->
        <section aria-labelledby="open-quotes" class="min-w-0">
          <div class="flex items-baseline justify-between gap-3">
            <h2 id="open-quotes" class="admin-section-title">Open quotes</h2>
            <NuxtLink to="/admin/quotes" class="admin-link">All quotes</NuxtLink>
          </div>
          <div class="admin-list mt-3">
            <div v-for="q in openQuotes" :key="q.id" class="admin-row">
              <div class="min-w-0 flex-1">
                <p class="truncate">
                  <NuxtLink :to="`/admin/quotes/${q.id}`" class="admin-row-link">{{ q.name || q.email }}</NuxtLink>
                  <span v-if="q.company" class="hidden text-bone-400 sm:inline"> · {{ q.company }}</span>
                </p>
                <p v-if="q.company" class="truncate text-sm text-bone-400 sm:hidden">{{ q.company }}</p>
                <p class="mt-0.5 truncate text-xs text-ink-400">
                  {{ formatDate(q.createdAt) }} · {{ q.itemCount }} {{ q.itemCount === 1 ? 'item' : 'items' }}
                </p>
              </div>
              <div class="shrink-0 text-right">
                <AdminQuoteStatusBadge :status="q.status" />
                <p v-if="q.lastOfferTotal != null" class="mt-1.5 whitespace-nowrap text-xs tabular-nums text-bone-100">{{ formatMoney(q.lastOfferTotal, q.lastOfferCurrency) }}</p>
              </div>
              <AdminIcon name="right" :size="16" class="text-ink-500" />
            </div>
            <p v-if="!openQuotes.length" class="px-4 py-8 text-center text-sm text-bone-400">
              Nothing waiting. New requests from the website show up here.
            </p>
          </div>
          <p v-if="openCount > openQuotes.length" class="mt-2 text-xs text-ink-400">
            Showing {{ openQuotes.length }} of {{ openCount }} open quotes.
          </p>
        </section>

        <div class="min-w-0 space-y-8">
          <!-- Latest agreements -->
          <section aria-labelledby="recent-contracts">
            <div class="flex items-baseline justify-between gap-3">
              <h2 id="recent-contracts" class="admin-section-title">Latest contracts</h2>
              <NuxtLink to="/admin/contracts" class="admin-link">All contracts</NuxtLink>
            </div>
            <div class="admin-list mt-3">
              <div v-for="c in recentContracts" :key="c.id" class="admin-row">
                <div class="min-w-0 flex-1">
                  <p class="truncate">
                    <NuxtLink :to="`/admin/contracts/${c.id}`" class="admin-row-link">{{ c.renterName || `Agreement ${c.number}` }}</NuxtLink>
                  </p>
                  <p class="mt-0.5 truncate text-xs text-ink-400">{{ c.renterName ? `Agreement ${c.number}` : 'Draft' }} · {{ formatDay(c.agreementDate) }}</p>
                </div>
                <AdminIcon name="right" :size="16" class="text-ink-500" />
              </div>
              <p v-if="!recentContracts.length" class="px-4 py-8 text-center text-sm text-bone-400">
                No rental agreements yet.
                <NuxtLink to="/admin/contracts" class="admin-link !text-sm">Write the first one</NuxtLink>
              </p>
            </div>
          </section>

          <!-- The catalogue at a glance: counts only, each row opens its list -->
          <section aria-labelledby="catalogue">
            <h2 id="catalogue" class="admin-section-title">Catalogue</h2>
            <ul class="admin-list mt-3">
              <li v-for="c in catalogue" :key="c.to">
                <NuxtLink :to="c.to" class="admin-row group text-sm">
                  <AdminIcon :name="c.icon" class="text-ink-400 transition-colors group-hover:text-gold-400" />
                  <span class="flex-1 text-bone-100">{{ c.label }}</span>
                  <span class="text-xs text-ink-400">{{ c.hint }}</span>
                  <span class="w-8 text-right font-semibold tabular-nums text-bone-100">{{ c.count }}</span>
                  <AdminIcon name="right" :size="16" class="text-ink-500" />
                </NuxtLink>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { AdminIconName } from '~/components/admin/Icon.vue'
import type { EquipmentCategoryDef, EquipmentItem, QuoteSummary, RentalContractSummary, RentalStatsSummary, Vehicle } from '~/types'

definePageMeta({ layout: 'admin' })

interface Overview {
  vehicles: Vehicle[]
  equipment: EquipmentItem[]
  categories: EquipmentCategoryDef[]
  quotes: QuoteSummary[]
  contracts: RentalContractSummary[]
  stats: RentalStatsSummary
}

const data = ref<Overview | null>(null)
const loadError = ref('')
const newQuotes = useState<number>('admin-new-quotes', () => 0) // sidebar badge

onMounted(async () => {
  const t = Date.now() // bypass any intermediary cache
  try {
    const [vehicles, equipment, categories, quotes, contracts, rentals] = await Promise.all([
      $fetch<Vehicle[]>('/api/admin/vehicles', { query: { t } }),
      $fetch<EquipmentItem[]>('/api/equipment', { query: { t } }),
      $fetch<EquipmentCategoryDef[]>('/api/admin/equipment-categories', { query: { t } }),
      $fetch<QuoteSummary[]>('/api/admin/quotes', { query: { t } }),
      $fetch<RentalContractSummary[]>('/api/admin/contracts', { query: { t } }),
      $fetch<{ summary: RentalStatsSummary }>('/api/admin/rental-stats', { query: { t } }),
    ])
    data.value = { vehicles, equipment, categories, quotes, contracts, stats: rentals.summary }
    newQuotes.value = quotes.filter(q => q.status === 'new').length
  }
  catch {
    loadError.value = 'Could not load the overview. Is the server running?'
  }
})

const count = (status: QuoteSummary['status']) => data.value?.quotes.filter(q => q.status === status).length ?? 0

const tiles = computed(() => {
  if (!data.value) return []
  const fresh = count('new')
  return [
    { label: 'New quotes', value: fresh, hint: fresh ? 'Waiting for your offer' : 'All answered', to: '/admin/quotes', highlight: fresh > 0 },
    { label: 'Offers sent', value: count('offered'), hint: 'Waiting on the customer', to: '/admin/quotes', highlight: false },
    { label: 'Quotes won', value: count('won'), hint: `${count('lost')} lost`, to: '/admin/quotes', highlight: false },
    { label: 'Confirmed rentals', value: data.value.stats.confirmedOffers, hint: 'See rental stats', to: '/admin/rentals', highlight: false },
  ]
})

// New requests first (they need an offer), then sent offers; newest first inside each.
const open = computed(() =>
  (data.value?.quotes ?? [])
    .filter(q => q.status === 'new' || q.status === 'offered')
    .sort((a, b) => Number(b.status === 'new') - Number(a.status === 'new') || b.createdAt.localeCompare(a.createdAt)))
const openCount = computed(() => open.value.length)
const openQuotes = computed(() => open.value.slice(0, 6))

const recentContracts = computed(() =>
  [...(data.value?.contracts ?? [])].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3))

const catalogue = computed<{ label: string, hint: string, count: number, to: string, icon: AdminIconName }[]>(() => {
  if (!data.value) return []
  const d = data.value
  const noPhoto = d.equipment.filter(e => !e.images[0]).length
  return [
    { label: 'Vehicles', hint: `${d.vehicles.filter(v => v.featured).length} featured`, count: d.vehicles.length, to: '/admin/vehicles', icon: 'vehicles' },
    { label: 'Equipment', hint: noPhoto ? `${noPhoto} without a photo` : `${d.equipment.filter(e => e.featured).length} featured`, count: d.equipment.length, to: '/admin/equipment', icon: 'equipment' },
    { label: 'Categories', hint: '', count: d.categories.filter(c => c.status === 'active').length, to: '/admin/equipment/categories', icon: 'categories' },
  ]
})

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

const formatDay = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const formatMoney = (n: number, currency?: string) =>
  currency === 'EUR' ? `€${n.toLocaleString('en-US')}` : `${n.toLocaleString('is-IS')} kr.`

useHead({ title: 'Overview · Admin · Creative Filmmaking' })
</script>
