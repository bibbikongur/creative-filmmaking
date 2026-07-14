<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="kicker">Quotes</p>
        <h1 class="mt-2 text-3xl font-semibold uppercase tracking-wide text-bone-100">Quote requests</h1>
      </div>
      <NuxtLink to="/admin/quotes/new" class="btn-gold !px-5 !py-2.5">+ New quote</NuxtLink>
    </div>

    <p v-if="loadError" class="mt-8 text-sm text-signal-500">{{ loadError }}</p>
    <p v-else-if="!loaded" class="mt-8 text-sm text-bone-400">Loading quote requests…</p>

    <div v-else class="mt-8 border border-ink-800 divide-y divide-ink-800">
      <NuxtLink
        v-for="q in quotes"
        :key="q.id"
        :to="`/admin/quotes/${q.id}`"
        class="flex items-center gap-4 p-4 bg-ink-900/50 hover:bg-ink-900 transition-colors"
      >
        <div class="min-w-0 flex-1">
          <p class="font-semibold text-bone-100 truncate">
            {{ q.name || q.email }}
            <span v-if="q.company" class="text-bone-400 font-normal">· {{ q.company }}</span>
            <span v-if="q.source === 'admin'" class="ml-1 text-[10px] uppercase tracking-widest text-gold-400/80 font-normal">· sent by you</span>
          </p>
          <p class="mt-0.5 text-xs text-bone-400 truncate">
            {{ formatDate(q.createdAt) }} · {{ q.itemCount }} {{ q.itemCount === 1 ? 'item' : 'items' }}
            · {{ q.email }}
            <span v-if="q.lastOfferTotal != null"> · last offer {{ formatTotal(q) }}</span>
          </p>
        </div>
        <AdminQuoteStatusBadge :status="q.status" />
        <button
          type="button"
          class="text-xs uppercase tracking-widest text-signal-500/80 hover:text-signal-500 transition-colors disabled:opacity-50"
          :disabled="deleting === q.id"
          @click.prevent.stop="remove(q)"
        >
          {{ deleting === q.id ? '…' : 'Delete' }}
        </button>
      </NuxtLink>

      <p v-if="!quotes.length" class="p-8 text-center text-sm text-bone-400">
        No quotes yet. They appear here when visitors submit their cart, or create one yourself with “New quote”.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { QuoteSummary } from '~/types'

definePageMeta({ layout: 'admin' })

const quotes = ref<QuoteSummary[]>([])
const loaded = ref(false)
const loadError = ref('')
const deleting = ref('')

const load = async () => {
  loadError.value = ''
  try {
    quotes.value = await $fetch<QuoteSummary[]>('/api/admin/quotes', {
      query: { t: Date.now() }, // bypass any intermediary cache
    })
    loaded.value = true
  }
  catch {
    loadError.value = 'Could not load quote requests. Is the server running?'
  }
}

onMounted(load)

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

const formatTotal = (q: QuoteSummary) =>
  q.lastOfferCurrency === 'EUR'
    ? `€${q.lastOfferTotal!.toLocaleString('en-US')}`
    : `${q.lastOfferTotal!.toLocaleString('is-IS')} kr.`

const remove = async (q: QuoteSummary) => {
  if (!confirm(`Delete the quote for "${q.name || q.email}"? This also deletes its offers.`)) return
  deleting.value = q.id
  try {
    await $fetch(`/api/admin/quotes/${q.id}`, { method: 'DELETE' })
    quotes.value = quotes.value.filter(x => x.id !== q.id)
  }
  catch (e: any) {
    alert(e?.data?.statusMessage || 'Delete failed.')
  }
  finally {
    deleting.value = ''
  }
}

useHead({ title: 'Quotes · Admin · Creative Filmmaking' })
</script>
