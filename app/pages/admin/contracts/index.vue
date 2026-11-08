<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="kicker">Contracts</p>
        <h1 class="mt-2 text-3xl font-semibold uppercase tracking-wide text-bone-100">Rental agreements</h1>
      </div>
      <button type="button" class="btn-ghost !px-4 !py-2 !text-xs disabled:opacity-50" :disabled="creating" @click="createBlank">
        {{ creating === 'blank' ? 'Creating…' : '+ Blank agreement' }}
      </button>
    </div>

    <!-- New from a quote -->
    <div class="mt-8 border border-ink-800 bg-ink-900/50 p-5">
      <h2 class="text-xs uppercase tracking-widest text-bone-400">New agreement from a quote</h2>
      <p class="mt-1 text-xs text-bone-400 leading-relaxed">
        The renter, the vehicles (one line per unit, with the registration number when the listing has one) and the
        charges are filled in from the quote's confirmed offer, or its latest offer. Everything can be edited before printing.
      </p>
      <div class="mt-4 flex flex-wrap gap-3 items-end">
        <div class="flex-1 min-w-[16rem]">
          <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">Quote</label>
          <select v-model="selectedQuote" class="input-dark">
            <option value="" disabled>Choose a quote…</option>
            <option v-for="q in quoteOptions" :key="q.id" :value="q.id">{{ q.label }}</option>
          </select>
        </div>
        <button
          type="button"
          class="btn-gold !px-5 !py-2.5 disabled:opacity-50"
          :disabled="!selectedQuote || !!creating"
          @click="createFromQuote"
        >
          {{ creating === 'quote' ? 'Creating…' : 'Create agreement' }}
        </button>
      </div>
      <p v-if="createError" class="mt-3 text-sm text-signal-500">{{ createError }}</p>
    </div>

    <p v-if="loadError" class="mt-8 text-sm text-signal-500">{{ loadError }}</p>
    <p v-else-if="!loaded" class="mt-8 text-sm text-bone-400">Loading agreements…</p>

    <div v-else class="mt-8 border border-ink-800 divide-y divide-ink-800">
      <NuxtLink
        v-for="c in contracts"
        :key="c.id"
        :to="`/admin/contracts/${c.id}`"
        class="flex items-center gap-4 p-4 bg-ink-900/50 hover:bg-ink-900 transition-colors"
      >
        <div class="min-w-0 flex-1">
          <p class="font-semibold text-bone-100 truncate">
            <span class="font-mono text-gold-400">{{ c.number }}</span>
            <span class="mx-1.5 text-ink-500">·</span>
            {{ c.renterName || 'No renter yet' }}
          </p>
          <p class="mt-0.5 text-xs text-bone-400 truncate">
            {{ formatDate(c.agreementDate) }}
            · {{ c.vehicleCount }} {{ c.vehicleCount === 1 ? 'vehicle' : 'vehicles' }}
            <span v-if="c.regNos.length"> · {{ c.regNos.join(', ') }}</span>
            <span v-if="c.total != null"> · {{ formatMoney(c.total, c.currency) }}</span>
            <span v-if="c.quoteId"> · quote {{ c.quoteId }}</span>
          </p>
        </div>
        <a
          :href="`/api/admin/contracts/${c.id}/pdf`"
          target="_blank"
          class="btn-ghost !px-4 !py-2 !text-xs"
          @click.stop
        >Print ↗</a>
        <button
          type="button"
          class="text-xs uppercase tracking-widest text-signal-500/80 hover:text-signal-500 transition-colors disabled:opacity-50"
          :disabled="deleting === c.id"
          @click.prevent.stop="remove(c)"
        >
          {{ deleting === c.id ? '…' : 'Delete' }}
        </button>
      </NuxtLink>

      <p v-if="!contracts.length" class="p-8 text-center text-sm text-bone-400">
        No agreements yet. Pick a quote above, or open a quote and use “Rental agreement” next to its offer.
      </p>
    </div>
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
