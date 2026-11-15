<template>
  <div>
    <AdminPageHeader
      title="Contracts"
      description="Printable rental agreements, filled in from a quote or by hand."
      :crumbs="[{ label: 'Sales' }, { label: 'Contracts' }]"
    >
      <template #actions>
        <button type="button" class="btn-sm" :class="showForm ? 'btn-outline' : 'btn-gold'" :aria-expanded="showForm" aria-controls="new-agreement" @click="showForm = !showForm">
          <AdminIcon :name="showForm ? 'close' : 'plus'" :size="16" /> {{ showForm ? 'Close' : 'New agreement' }}
        </button>
      </template>
    </AdminPageHeader>

    <!-- New agreement: from a quote, or blank -->
    <section v-if="showForm" id="new-agreement" class="admin-card rail-top mt-6 p-5 sm:p-6" aria-labelledby="new-from-quote">
      <h2 id="new-from-quote" class="admin-card-title">New agreement</h2>
      <div class="mt-4 flex flex-wrap items-end gap-3">
        <div class="min-w-[16rem] flex-1">
          <label for="contract-quote" class="admin-label">Fill it in from a quote</label>
          <select id="contract-quote" v-model="selectedQuote" class="input-dark">
            <option value="" disabled>Choose a quote…</option>
            <option v-for="q in quoteOptions" :key="q.id" :value="q.id">{{ q.label }}</option>
          </select>
        </div>
        <button
          type="button"
          class="btn-gold"
          :disabled="!selectedQuote || !!creating"
          @click="createFromQuote"
        >
          {{ creating === 'quote' ? 'Creating…' : 'Create agreement' }}
        </button>
        <button type="button" class="btn-outline" :disabled="!!creating" @click="createBlank">
          {{ creating === 'blank' ? 'Creating…' : 'Start blank' }}
        </button>
      </div>
      <p class="mt-3 max-w-3xl text-xs leading-relaxed text-ink-400">
        From a quote, the renter, the vehicles and the charges come from its confirmed offer, or its latest one: one line per
        vehicle unit, with the registration number when the listing has one. Everything can be edited before printing.
      </p>
      <p v-if="createError" class="mt-3 text-sm text-signal-400" role="alert">{{ createError }}</p>
    </section>

    <AdminStateMessage v-if="loadError" kind="error" class="mt-6">{{ loadError }}</AdminStateMessage>
    <AdminStateMessage v-else-if="!loaded" kind="loading" class="mt-6">Loading agreements…</AdminStateMessage>

    <AdminStateMessage v-else-if="!contracts.length" title="No agreements yet" class="mt-6">
      Start one here, or open a quote and use “Write agreement” next to its offer.
      <template v-if="!showForm" #action>
        <button type="button" class="btn-outline btn-sm" @click="showForm = true">New agreement</button>
      </template>
    </AdminStateMessage>

    <template v-else>
      <AdminToolbar v-model:search="search" class="mt-6" placeholder="Search renter, number, plate…" :count="countLabel" />

      <div class="admin-list mt-4">
        <div class="admin-list-head hidden md:grid" :class="cols">
          <span>Renter</span>
          <span>Date</span>
          <span>Vehicles</span>
          <span class="text-right">Total</span>
          <span class="text-right">Actions</span>
        </div>

        <div v-for="c in visible" :key="c.id" class="admin-row md:grid" :class="cols">
          <div class="min-w-0 flex-1">
            <p class="truncate">
              <NuxtLink :to="`/admin/contracts/${c.id}`" class="admin-row-link">{{ c.renterName || `Agreement ${c.number}` }}</NuxtLink>
              <span v-if="!c.renterName" class="admin-chip ml-2 border-ink-500 text-bone-400">Draft</span>
            </p>
            <p class="mt-0.5 text-xs text-ink-400 md:truncate">
              <template v-if="c.renterName">Agreement {{ c.number }}</template><template v-else>No renter filled in yet</template>
              <span class="md:hidden"> · {{ formatDate(c.agreementDate) }}<template v-if="c.total != null"> · {{ formatMoney(c.total, c.currency) }}</template></span>
            </p>
          </div>
          <p class="hidden md:block whitespace-nowrap text-sm tabular-nums text-bone-400">{{ formatDate(c.agreementDate) }}</p>
          <p class="hidden md:block truncate text-sm text-bone-400" :title="c.regNos.join(', ')">
            <template v-if="c.vehicleCount">{{ c.vehicleCount }}<span v-if="c.regNos.length" class="text-ink-400"> · {{ c.regNos.join(', ') }}</span></template>
            <span v-else class="text-ink-500">–</span>
          </p>
          <p class="hidden md:block whitespace-nowrap text-right text-sm tabular-nums text-bone-100">
            <template v-if="c.total != null">{{ formatMoney(c.total, c.currency) }}</template>
            <span v-else class="text-ink-500">–</span>
          </p>
          <div class="admin-row-actions">
            <button type="button" class="btn-outline btn-sm hidden sm:inline-flex" :aria-label="`View the PDF of agreement ${c.number}`" @click="view(c)">
              PDF
            </button>
            <button
              type="button"
              class="admin-icon-action-danger max-sm:!hidden"
              :disabled="deleting === c.id"
              :aria-label="`Delete agreement ${c.number}`"
              title="Delete"
              @click="remove(c)"
            >
              <AdminIcon name="trash" />
            </button>
            <AdminIcon name="right" :size="16" class="ml-1 text-ink-500" />
          </div>
        </div>

        <p v-if="!visible.length" class="px-4 py-10 text-center text-sm text-bone-400">
          No agreements match.
          <button type="button" class="text-gold-400 hover:text-gold-500" @click="search = ''">Clear search</button>
        </p>
      </div>
    </template>

    <ContractPdfViewer :src="viewerSrc" :title="viewerTitle" @close="viewerSrc = null" />
  </div>
</template>

<script setup lang="ts">
import type { QuoteSummary, RentalContract, RentalContractSummary } from '~/types'

definePageMeta({ layout: 'admin' })
const { confirmDialog, alertDialog } = useAppDialog()

const contracts = ref<RentalContractSummary[]>([])
const quotes = ref<QuoteSummary[]>([])
const loaded = ref(false)
const loadError = ref('')
const deleting = ref<number | null>(null)
const creating = ref<'' | 'quote' | 'blank'>('')
const createError = ref('')
const selectedQuote = ref('')
const showForm = ref(false)

const load = async () => {
  loadError.value = ''
  try {
    const [c, q] = await Promise.all([
      $fetch<RentalContractSummary[]>('/api/admin/contracts', { query: { t: Date.now() } }),
      $fetch<QuoteSummary[]>('/api/admin/quotes', { query: { t: Date.now() } }),
    ])
    contracts.value = c
    quotes.value = q
    loaded.value = true
  }
  catch {
    loadError.value = 'Could not load the agreements. Is the server running?'
  }
}

onMounted(load)

// ---------- List ----------
const cols = 'md:grid-cols-[minmax(0,1fr)_6.5rem_minmax(0,9rem)_7.5rem_9.5rem]'
const search = ref('')
const visible = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return contracts.value
  return contracts.value.filter(c =>
    [c.renterName, c.number, c.quoteId, ...c.regNos].some(s => s?.toLowerCase().includes(q)))
})
const countLabel = computed(() =>
  visible.value.length === contracts.value.length
    ? `${contracts.value.length} ${contracts.value.length === 1 ? 'agreement' : 'agreements'}`
    : `${visible.value.length} of ${contracts.value.length}`)

// Quotes with an offer first (confirmed ones on top), then the rest.
const quoteOptions = computed(() =>
  [...quotes.value]
    .sort((a, b) => Number(b.confirmedOfferTotal != null) - Number(a.confirmedOfferTotal != null)
      || Number(b.lastOfferTotal != null) - Number(a.lastOfferTotal != null))
    .map(q => ({
      id: q.id,
      label: `${q.name || q.email}${q.company ? ` · ${q.company}` : ''}${q.dates ? ` · ${q.dates}` : ''}`
        + (q.confirmedOfferTotal != null
          ? ` · confirmed ${formatMoney(q.confirmedOfferTotal, q.confirmedOfferCurrency ?? 'ISK')}`
          : q.lastOfferTotal != null ? ` · offer ${formatMoney(q.lastOfferTotal, q.lastOfferCurrency ?? 'ISK')}` : ' · no offer yet'),
    })))

const createFromQuote = async () => {
  if (!selectedQuote.value) return
  creating.value = 'quote'
  createError.value = ''
  try {
    const c = await $fetch<RentalContract>('/api/admin/contracts', { method: 'POST', body: { quoteId: selectedQuote.value } })
    await navigateTo(`/admin/contracts/${c.id}`)
  }
  catch (e: any) {
    createError.value = e?.data?.statusMessage || 'Could not create the agreement.'
  }
  finally {
    creating.value = ''
  }
}

const createBlank = async () => {
  creating.value = 'blank'
  createError.value = ''
  try {
    const c = await $fetch<RentalContract>('/api/admin/contracts', { method: 'POST', body: {} })
    await navigateTo(`/admin/contracts/${c.id}`)
  }
  catch (e: any) {
    createError.value = e?.data?.statusMessage || 'Could not create the agreement.'
  }
  finally {
    creating.value = ''
  }
}

// In-page PDF viewer
const viewerSrc = ref<string | null>(null)
const viewerTitle = ref('')
const view = (c: RentalContractSummary) => {
  viewerTitle.value = `Rental agreement ${c.number}${c.renterName ? ` · ${c.renterName}` : ''}`
  viewerSrc.value = `/api/admin/contracts/${c.id}/pdf?t=${Date.now()}`
}

const remove = async (c: RentalContractSummary) => {
  if (!await confirmDialog(`Delete agreement ${c.number}${c.renterName ? ` (${c.renterName})` : ''}? This cannot be undone.`)) return
  deleting.value = c.id
  try {
    await $fetch(`/api/admin/contracts/${c.id}`, { method: 'DELETE' })
    contracts.value = contracts.value.filter(x => x.id !== c.id)
  }
  catch (e: any) {
    await alertDialog(e?.data?.statusMessage || 'Delete failed.')
  }
  finally {
    deleting.value = null
  }
}

const formatDate = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const formatMoney = (n: number, currency: string) =>
  currency === 'EUR' ? `€${n.toLocaleString('en-US')}` : `${Math.round(n).toLocaleString('is-IS')} kr.`

useHead({ title: 'Contracts · Admin · Creative Filmmaking' })
</script>
