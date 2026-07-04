<template>
  <div class="border border-ink-800 bg-ink-900/50 p-5">
    <!-- Item pricing -->
    <div class="divide-y divide-ink-800">
      <div v-for="item in quote.items" :key="item.id" class="flex items-center gap-4 py-3">
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
          <p class="mt-0.5 text-xs uppercase tracking-widest text-bone-400">
            {{ item.itemType }}<span v-if="item.qty > 1"> · qty {{ item.qty }}</span>
          </p>
        </div>
        <div class="flex items-center gap-2">
          <input
            v-model.number="prices[item.id]"
            type="number"
            min="0"
            step="any"
            class="input-dark !w-32 text-right"
            :placeholder="`Price / unit`"
          >
          <span class="text-xs text-bone-400 w-20">
            {{ item.qty > 1 && isPriced(item.id) ? `= ${fmt(prices[item.id]! * item.qty)}` : currencySuffix }}
          </span>
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
      <p class="text-lg font-semibold text-bone-100">Total: <span class="tabular-nums">{{ fmt(total) }}</span></p>
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
import type { Offer, QuoteDetail } from '~/types'

const props = defineProps<{ quote: QuoteDetail }>()
const emit = defineEmits<{ saved: [] }>()

// Prefill from the latest offer revision so "revise & resend" starts from
// what the customer last saw.
const latest = props.quote.offers[props.quote.offers.length - 1]
const prices = reactive<Record<number, number | null>>({})
for (const item of props.quote.items) {
  const prev = latest?.items.find(i => i.quoteItemId === item.id)
  prices[item.id] = prev ? prev.unitPrice : null
}
const currency = ref<'ISK' | 'EUR'>(latest?.currency ?? 'ISK')
const discountType = ref<'' | 'percent' | 'fixed'>(latest?.discountType ?? '')
const discountValue = ref<number | null>(latest?.discountValue ?? null)
const note = ref(latest?.note ?? '')
const validUntil = ref(latest?.validUntil ?? '')

const busy = ref<'' | 'preview' | 'send'>('')
const error = ref('')
const notice = ref('')

const isPriced = (id: number) => typeof prices[id] === 'number' && Number.isFinite(prices[id]!) && prices[id]! >= 0
const complete = computed(() => props.quote.items.every(i => isPriced(i.id)))

const subtotal = computed(() =>
  props.quote.items.reduce((sum, i) => sum + (isPriced(i.id) ? prices[i.id]! * i.qty : 0), 0))
const discountAmount = computed(() => {
  const v = discountValue.value
  if (!discountType.value || !v || v <= 0) return 0
  return discountType.value === 'percent'
    ? subtotal.value * Math.min(v, 100) / 100
    : Math.min(v, subtotal.value)
})
const total = computed(() => subtotal.value - discountAmount.value)

const fmt = (n: number) => currency.value === 'EUR'
  ? `€${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
  : `${Math.round(n).toLocaleString('is-IS')} kr.`

const payload = (send: boolean) => ({
  send,
  currency: currency.value,
  discountType: discountType.value || undefined,
  discountValue: discountType.value ? discountValue.value : undefined,
  note: note.value || undefined,
  validUntil: validUntil.value || undefined,
  items: props.quote.items.map(i => ({ quoteItemId: i.id, unitPrice: prices[i.id]! })),
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
  if (!confirm(`Send this offer (${fmt(total.value)}) to ${props.quote.email}?`)) return
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
    error.value = e?.data?.data?.errors?.join(' ') || e?.data?.statusMessage || 'Sending failed. The offer was saved — fix the issue and resend.'
    emit('saved')
  }
  finally {
    busy.value = ''
  }
}

const currencySuffix = computed(() => currency.value === 'EUR' ? '€' : 'kr.')
</script>
