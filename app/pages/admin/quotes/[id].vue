<template>
  <div v-if="quote">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="kicker">
          <NuxtLink to="/admin/quotes" class="hover:text-gold-400 transition-colors">Quotes</NuxtLink>
          <span class="text-ink-500 mx-1">/</span> {{ quote.id }}
        </p>
        <h1 class="mt-2 text-3xl font-semibold uppercase tracking-wide text-bone-100">
          {{ quote.name || quote.email }}
          <span v-if="quote.company" class="text-bone-400">· {{ quote.company }}</span>
        </h1>
        <p v-if="quote.source === 'admin'" class="mt-1 text-xs uppercase tracking-widest text-gold-400/80">Created in the admin panel</p>
      </div>
      <AdminQuoteStatusBadge :status="quote.status" class="!text-xs" />
    </div>

    <!-- Customer / edit form -->
    <div class="mt-8 border border-ink-800 bg-ink-900/50 p-5">
      <template v-if="!editing">
        <div class="flex items-start justify-between gap-4">
          <h2 class="text-xs uppercase tracking-widest text-bone-400">Details</h2>
          <button type="button" class="btn-ghost !px-4 !py-1.5 !text-xs" @click="startEdit">
            Edit quote
          </button>
        </div>
        <div class="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div>
            <p class="text-xs uppercase tracking-widest text-bone-400">Email</p>
            <a :href="`mailto:${quote.email}`" class="mt-1 block text-gold-400 hover:text-gold-500 transition-colors break-all">{{ quote.email }}</a>
          </div>
          <div>
            <p class="text-xs uppercase tracking-widest text-bone-400">Phone</p>
            <p class="mt-1 text-bone-100">{{ quote.phone || '–' }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-widest text-bone-400">Shooting dates</p>
            <p class="mt-1 text-bone-100">{{ quote.dates || '–' }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-widest text-bone-400">{{ quote.source === 'admin' ? 'Created' : 'Submitted' }}</p>
            <p class="mt-1 text-bone-100">{{ formatDateTime(quote.createdAt) }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-widest text-bone-400">Language</p>
            <p class="mt-1 text-bone-100">{{ quote.locale === 'is' ? 'Icelandic' : 'English' }} <span class="text-bone-400 text-xs">(offer email + PDF)</span></p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-widest text-bone-400">Status</p>
            <div class="mt-1.5 flex gap-2">
              <button
                v-for="s in statusOptions"
                :key="s"
                type="button"
                class="text-[10px] uppercase tracking-widest px-2 py-1 border transition-colors"
                :class="quote.status === s ? 'text-gold-400 border-gold-500/60' : 'text-bone-400 border-ink-700 hover:border-bone-400/50'"
                @click="setStatus(s)"
              >
                {{ s }}
              </button>
            </div>
          </div>
          <div v-if="quote.message" class="sm:col-span-2 lg:col-span-3">
            <p class="text-xs uppercase tracking-widest text-bone-400">Message</p>
            <p class="mt-1 text-bone-100 whitespace-pre-line">{{ quote.message }}</p>
          </div>
        </div>
      </template>

      <template v-else>
        <h2 class="text-xs uppercase tracking-widest text-bone-400">Edit quote</h2>
        <div class="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">Email *</label>
            <input v-model.trim="edit.email" type="email" class="input-dark" placeholder="customer@example.com">
          </div>
          <div>
            <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">Name</label>
            <input v-model.trim="edit.name" type="text" class="input-dark" placeholder="Contact name (optional)">
          </div>
          <div>
            <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">Company</label>
            <input v-model.trim="edit.company" type="text" class="input-dark" placeholder="Optional">
          </div>
          <div>
            <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">Phone</label>
            <input v-model.trim="edit.phone" type="text" class="input-dark" placeholder="Optional">
          </div>
          <div>
            <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">Language</label>
            <select v-model="edit.locale" class="input-dark">
              <option value="en">English</option>
              <option value="is">Icelandic</option>
            </select>
          </div>
          <div>
            <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">Shooting dates</label>
            <input v-model.trim="edit.dates" type="text" class="input-dark" placeholder="e.g. 12–18 August 2026 (optional)">
          </div>
        </div>

        <AdminQuoteItemsPicker v-model="draftItems" class="mt-8" />

        <p v-if="saveError" class="mt-4 text-sm text-signal-500">{{ saveError }}</p>

        <div class="mt-6 flex flex-wrap gap-3 justify-end">
          <button type="button" class="btn-ghost !text-xs" :disabled="saving" @click="editing = false">
            Cancel
          </button>
          <button
            type="button"
            class="btn-gold !px-5 !py-2.5 disabled:opacity-50"
            :disabled="!canSave || saving"
            @click="saveEdit"
          >
            {{ saving ? 'Saving…' : 'Save changes' }}
          </button>
        </div>
      </template>
    </div>

    <!-- Offer builder -->
    <template v-if="!editing">
      <h2 class="mt-12 text-xl font-semibold uppercase tracking-wide text-bone-100">Make an offer</h2>
      <AdminOfferForm :key="offerFormKey" :quote="quote" class="mt-5" @saved="reload" />
    </template>

    <!-- Offer history -->
    <template v-if="quote.offers.length">
      <h2 class="mt-12 text-xl font-semibold uppercase tracking-wide text-bone-100">Offer history</h2>
      <div class="mt-5 border border-ink-800 divide-y divide-ink-800">
        <div v-for="o in [...quote.offers].reverse()" :key="o.id" class="flex items-center gap-4 p-4 bg-ink-900/50 text-sm">
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-bone-100">
              Offer #{{ o.id }} · {{ formatMoneyLocal(o.total, o.currency) }}
              <span v-if="o.discountAmount" class="text-bone-400 font-normal">(incl. {{ o.discountType === 'percent' ? `${o.discountValue}%` : formatMoneyLocal(o.discountAmount, o.currency) }} discount)</span>
            </p>
            <p class="mt-0.5 text-xs text-bone-400">
              {{ o.sentAt ? `Sent ${formatDateTime(o.sentAt)}` : `Saved ${formatDateTime(o.createdAt)}, not sent` }}
            </p>
          </div>
          <a
            :href="`/api/admin/quotes/${quote.id}/offers/${o.id}`"
            target="_blank"
            class="btn-ghost !px-4 !py-2 !text-xs"
          >PDF ↗</a>
        </div>
      </div>
    </template>
  </div>

  <p v-else-if="loadError" class="text-sm text-signal-500">{{ loadError }}</p>
  <p v-else class="text-sm text-bone-400">Loading…</p>
</template>

<script setup lang="ts">
import type { LocaleCode, QuoteDetail, QuoteDraftItem, QuoteStatus } from '~/types'

definePageMeta({ layout: 'admin' })

const route = useRoute()
const quote = ref<QuoteDetail | null>(null)
const loadError = ref('')

const statusOptions: QuoteStatus[] = ['new', 'offered', 'won', 'lost']

const reload = async () => {
  loadError.value = ''
  try {
    quote.value = await $fetch<QuoteDetail>(`/api/admin/quotes/${route.params.id}`, {
      query: { t: Date.now() },
    })
  }
  catch (e: any) {
    loadError.value = e?.statusCode === 404 ? 'Quote request not found.' : 'Could not load the quote request.'
  }
}

onMounted(reload)

const setStatus = async (status: QuoteStatus) => {
  if (!quote.value || quote.value.status === status) return
  try {
    await $fetch(`/api/admin/quotes/${quote.value.id}`, { method: 'PATCH', body: { status } })
    quote.value.status = status
  }
  catch (e: any) {
    alert(e?.data?.statusMessage || 'Could not update status.')
  }
}

// ── Edit mode ────────────────────────────────────────────────────────────────

const editing = ref(false)
const saving = ref(false)
const saveError = ref('')
const edit = reactive({
  email: '', name: '', company: '', phone: '', dates: '',
  locale: 'en' as LocaleCode,
})
const draftItems = ref<QuoteDraftItem[]>([])

const startEdit = () => {
  if (!quote.value) return
  edit.email = quote.value.email
  edit.name = quote.value.name
  edit.company = quote.value.company ?? ''
  edit.phone = quote.value.phone ?? ''
  edit.dates = quote.value.dates ?? ''
  edit.locale = quote.value.locale
  draftItems.value = quote.value.items.map(i => ({
    type: i.itemType, id: i.itemId, qty: i.qty, name: i.name.en, image: i.image,
  }))
  saveError.value = ''
  editing.value = true
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const canSave = computed(() => EMAIL_RE.test(edit.email) && draftItems.value.length > 0)

const saveEdit = async () => {
  saving.value = true
  saveError.value = ''
  try {
    await $fetch(`/api/admin/quotes/${route.params.id}`, {
      method: 'PATCH',
      body: {
        email: edit.email,
        name: edit.name,
        company: edit.company || undefined,
        phone: edit.phone || undefined,
        dates: edit.dates || undefined,
        locale: edit.locale,
        items: draftItems.value.map(e => ({ type: e.type, id: e.id, qty: e.qty || 1 })),
      },
    })
    await reload()
    editing.value = false
  }
  catch (e: any) {
    saveError.value = e?.data?.data?.errors?.join(' ') || e?.data?.statusMessage || 'Could not save the changes.'
  }
  finally {
    saving.value = false
  }
}

// Re-init the offer form whenever the item list changes (its price fields are
// seeded once per mount from the quote items).
const offerFormKey = computed(() =>
  quote.value ? quote.value.items.map(i => `${i.id}:${i.qty}`).join('|') : '')

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const formatMoneyLocal = (n: number, currency: string) =>
  currency === 'EUR' ? `€${n.toLocaleString('en-US')}` : `${n.toLocaleString('is-IS')} kr.`

useHead({ title: 'Quote · Admin · Creative Filmmaking' })
</script>
