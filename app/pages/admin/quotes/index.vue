<template>
  <div>
    <AdminPageHeader
      title="Quotes"
      description="Requests from the website and quotes you created yourself."
      :crumbs="[{ label: 'Sales' }, { label: 'Quotes' }]"
    >
      <template #actions>
        <NuxtLink to="/admin/quotes/new" class="btn-gold btn-sm"><AdminIcon name="plus" :size="16" /> New quote</NuxtLink>
      </template>
    </AdminPageHeader>

    <AdminStateMessage v-if="loadError" kind="error" class="mt-6">{{ loadError }}</AdminStateMessage>
    <AdminStateMessage v-else-if="!loaded" kind="loading" class="mt-6">Loading quotes…</AdminStateMessage>

    <AdminStateMessage v-else-if="!quotes.length" title="No quotes yet" class="mt-6">
      They appear here when visitors submit their cart. You can also create one yourself.
      <template #action>
        <NuxtLink to="/admin/quotes/new" class="btn-gold btn-sm">New quote</NuxtLink>
      </template>
    </AdminStateMessage>

    <template v-else>
      <AdminToolbar v-model:search="search" class="mt-6" placeholder="Search name, company, email…" :count="countLabel">
        <button
          v-for="s in statusOptions"
          :key="s.value"
          type="button"
          class="admin-pill"
          :class="{ 'admin-pill-active': status === s.value }"
          :aria-pressed="status === s.value"
          @click="status = s.value"
        >
          {{ s.label }} <span class="tabular-nums opacity-70">{{ s.count }}</span>
        </button>
      </AdminToolbar>

      <div class="admin-list mt-4">
        <div class="admin-list-head hidden md:grid" :class="cols">
          <span>Customer</span>
          <span>Received</span>
          <span class="hidden text-right xl:block">Items</span>
          <span class="text-right">Offer</span>
          <span>Status</span>
          <span class="text-right">Actions</span>
        </div>

        <div v-for="q in visible" :key="q.id" class="admin-row items-start md:items-center md:grid" :class="cols">
          <div class="min-w-0 flex-1">
            <p class="truncate">
              <NuxtLink :to="`/admin/quotes/${q.id}`" class="admin-row-link">{{ q.name || q.email }}</NuxtLink>
              <span v-if="q.company" class="hidden text-bone-400 xl:inline"> · {{ q.company }}</span>
            </p>
            <p v-if="q.company" class="truncate text-sm text-bone-400 xl:hidden">{{ q.company }}</p>
            <p class="mt-0.5 truncate text-xs text-ink-400">
              <span class="md:hidden">{{ formatDate(q.createdAt) }} · {{ q.itemCount }} {{ q.itemCount === 1 ? 'item' : 'items' }}</span>
              <span class="hidden md:inline"><template v-if="q.name">{{ q.email }}</template><template v-if="q.source === 'admin'">{{ q.name ? ' · ' : '' }}created by you</template></span>
            </p>
          </div>
          <p class="hidden md:block text-sm text-bone-400 tabular-nums whitespace-nowrap">{{ formatDate(q.createdAt) }}</p>
          <p class="hidden xl:block text-right text-sm text-bone-400 tabular-nums">{{ q.itemCount }}</p>
          <p class="hidden md:block text-right text-sm tabular-nums whitespace-nowrap" :class="q.confirmedOfferTotal != null ? 'text-emerald-400' : 'text-bone-100'" :title="q.confirmedOfferTotal != null ? 'Confirmed offer' : q.lastOfferTotal != null ? 'Latest offer' : 'No offer yet'">
            <template v-if="q.confirmedOfferTotal != null">{{ formatMoney(q.confirmedOfferTotal, q.confirmedOfferCurrency) }}</template>
            <template v-else-if="q.lastOfferTotal != null">{{ formatMoney(q.lastOfferTotal, q.lastOfferCurrency) }}</template>
            <span v-else class="text-ink-500">–</span>
          </p>
          <div class="shrink-0 text-right md:text-left">
            <AdminQuoteStatusBadge :status="q.status" />
            <!-- On a phone the amount lives under the status, where it can never be cut off -->
            <p v-if="q.confirmedOfferTotal != null || q.lastOfferTotal != null" class="mt-1.5 whitespace-nowrap text-xs tabular-nums md:hidden" :class="q.confirmedOfferTotal != null ? 'text-emerald-400' : 'text-bone-100'">
              {{ q.confirmedOfferTotal != null ? formatMoney(q.confirmedOfferTotal, q.confirmedOfferCurrency) : formatMoney(q.lastOfferTotal!, q.lastOfferCurrency) }}
            </p>
          </div>
          <div class="admin-row-actions">
            <button
              type="button"
              class="admin-icon-action-danger !ml-0 max-sm:!hidden"
              :disabled="deleting === q.id"
              :aria-label="`Delete the quote for ${q.name || q.email}`"
              title="Delete"
              @click="remove(q)"
            >
              <AdminIcon name="trash" />
            </button>
            <AdminIcon name="right" :size="16" class="ml-1 text-ink-500" />
          </div>
        </div>

        <p v-if="!visible.length" class="px-4 py-10 text-center text-sm text-bone-400">
          No quotes match.
          <button type="button" class="text-gold-400 hover:text-gold-500" @click="search = ''; status = 'all'">Clear filters</button>
        </p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { QuoteStatus, QuoteSummary } from '~/types'

definePageMeta({ layout: 'admin' })
const { confirmDialog, alertDialog } = useAppDialog()

// The item count is the first thing to go when the table gets narrow
const cols = 'md:grid-cols-[minmax(0,1fr)_6.5rem_7.5rem_5.5rem_4.5rem] xl:grid-cols-[minmax(0,1fr)_6.5rem_3rem_7.5rem_5.5rem_4.5rem]'

const quotes = ref<QuoteSummary[]>([])
const loaded = ref(false)
const loadError = ref('')
const deleting = ref('')
const newQuotes = useState<number>('admin-new-quotes', () => 0) // sidebar badge

const load = async () => {
  loadError.value = ''
  try {
    quotes.value = await $fetch<QuoteSummary[]>('/api/admin/quotes', {
      query: { t: Date.now() }, // bypass any intermediary cache
    })
    loaded.value = true
  }
  catch {
    loadError.value = 'Could not load quotes. Is the server running?'
  }
}

onMounted(load)

// ---------- Filter ----------
type StatusFilter = QuoteStatus | 'all'
const status = ref<StatusFilter>('all')
const search = ref('')

const statusOptions = computed(() => {
  const count = (s: QuoteStatus) => quotes.value.filter(q => q.status === s).length
  return [
    { value: 'all' as StatusFilter, label: 'All', count: quotes.value.length },
    { value: 'new' as StatusFilter, label: 'New', count: count('new') },
    { value: 'offered' as StatusFilter, label: 'Offered', count: count('offered') },
    { value: 'won' as StatusFilter, label: 'Won', count: count('won') },
    { value: 'lost' as StatusFilter, label: 'Lost', count: count('lost') },
  ]
})

const visible = computed(() => {
  const q = search.value.trim().toLowerCase()
  return quotes.value.filter(x =>
    (status.value === 'all' || x.status === status.value)
    && (!q || [x.name, x.email, x.company, x.id].some(s => s?.toLowerCase().includes(q))))
})

const countLabel = computed(() =>
  visible.value.length === quotes.value.length
    ? `${quotes.value.length} ${quotes.value.length === 1 ? 'quote' : 'quotes'}`
    : `${visible.value.length} of ${quotes.value.length}`)

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

const formatMoney = (n: number, currency?: string) =>
  currency === 'EUR' ? `€${n.toLocaleString('en-US')}` : `${n.toLocaleString('is-IS')} kr.`

const remove = async (q: QuoteSummary) => {
  if (!await confirmDialog(`Delete the quote for "${q.name || q.email}"? This also deletes its offers.`)) return
  deleting.value = q.id
  try {
    await $fetch(`/api/admin/quotes/${q.id}`, { method: 'DELETE' })
    quotes.value = quotes.value.filter(x => x.id !== q.id)
    newQuotes.value = quotes.value.filter(x => x.status === 'new').length
  }
  catch (e: any) {
    await alertDialog(e?.data?.statusMessage || 'Delete failed.')
  }
  finally {
    deleting.value = ''
  }
}

useHead({ title: 'Quotes · Admin · Creative Filmmaking' })
</script>
