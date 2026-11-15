<template>
  <div v-if="quote">
    <AdminPageHeader stack-actions :crumbs="[{ label: 'Sales' }, { label: 'Quotes', to: '/admin/quotes' }, { label: quote.name || quote.email }]">
      <template #title>
        {{ quote.name || quote.email }}
        <span v-if="quote.company" class="text-bone-400">· {{ quote.company }}</span>
      </template>
      <template #description>
        Received {{ new Date(quote.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }}{{ quote.source === 'admin' ? ', created by you in the admin panel' : ' from the website' }}.
      </template>
      <template #actions>
        <!-- The one status control: shows the state and changes it -->
        <div class="flex items-center gap-3">
          <span id="quote-status-label" class="admin-eyebrow">Status</span>
          <div role="group" aria-labelledby="quote-status-label" class="inline-flex border border-ink-700">
            <button
              v-for="s in statusOptions"
              :key="s"
              type="button"
              class="h-11 md:h-9 px-3 text-xs font-semibold capitalize transition-colors border-l border-ink-700 first:border-l-0"
              :class="quote.status === s ? 'bg-gold-500 text-ink-950' : 'text-bone-400 hover:bg-ink-800 hover:text-bone-100'"
              :aria-pressed="quote.status === s"
              @click="setStatus(s)"
            >
              {{ s }}
            </button>
          </div>
        </div>
      </template>
    </AdminPageHeader>

    <!-- Customer / edit form -->
    <div class="mt-6 admin-card p-5 sm:p-6">
      <template v-if="!editing">
        <div class="flex items-start justify-between gap-4">
          <h2 class="admin-card-title">Details</h2>
          <button type="button" class="btn-outline btn-sm" @click="startEdit">
            Edit quote
          </button>
        </div>
        <div class="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div>
            <p class="admin-eyebrow">Email</p>
            <a :href="`mailto:${quote.email}`" class="mt-1 block text-gold-400 hover:text-gold-500 transition-colors break-all">{{ quote.email }}</a>
          </div>
          <div>
            <p class="admin-eyebrow">Phone</p>
            <p class="mt-1 text-bone-100">{{ quote.phone || '–' }}</p>
          </div>
          <div>
            <p class="admin-eyebrow">Kennitala</p>
            <p class="mt-1 text-bone-100">{{ quote.kennitala || '–' }}</p>
          </div>
          <div>
            <p class="admin-eyebrow">Rental period</p>
            <p class="mt-1 text-bone-100">{{ quote.dates || '–' }}</p>
          </div>
          <div>
            <p class="admin-eyebrow">{{ quote.source === 'admin' ? 'Created' : 'Submitted' }}</p>
            <p class="mt-1 text-bone-100">{{ formatDateTime(quote.createdAt) }}</p>
          </div>
          <div>
            <p class="admin-eyebrow">Language</p>
            <p class="mt-1 text-bone-100">{{ quote.locale === 'is' ? 'Icelandic' : 'English' }} <span class="text-bone-400 text-xs">(offer email + PDF)</span></p>
          </div>
          <div v-if="quote.message" class="sm:col-span-2 lg:col-span-3">
            <p class="admin-eyebrow">Message</p>
            <p class="mt-1 text-bone-100 whitespace-pre-line">{{ quote.message }}</p>
          </div>
        </div>
      </template>

      <template v-else>
        <h2 class="admin-card-title">Edit quote</h2>
        <div class="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label class="admin-label">Email *</label>
            <input v-model.trim="edit.email" type="email" class="input-dark" placeholder="customer@example.com">
          </div>
          <div>
            <label class="admin-label">Name</label>
            <input v-model.trim="edit.name" type="text" class="input-dark" placeholder="Contact name (optional)">
          </div>
          <div>
            <label class="admin-label">Company</label>
            <input v-model.trim="edit.company" type="text" class="input-dark" placeholder="Optional">
          </div>
          <div>
            <label class="admin-label">Kennitala</label>
            <input v-model.trim="edit.kennitala" type="text" class="input-dark" placeholder="Optional">
          </div>
          <div>
            <label class="admin-label">Phone</label>
            <input v-model.trim="edit.phone" type="text" class="input-dark" placeholder="Optional">
          </div>
          <div>
            <label class="admin-label">Language</label>
            <select v-model="edit.locale" class="input-dark">
              <option value="en">English</option>
              <option value="is">Icelandic</option>
            </select>
          </div>
          <div>
            <label class="admin-label">Rental period</label>
            <input v-model.trim="edit.dates" type="text" class="input-dark" placeholder="e.g. 12–18 August 2026 (optional)">
          </div>
        </div>

        <AdminQuoteItemsPicker v-model="draftItems" class="mt-8" />

        <p v-if="saveError" class="mt-4 text-sm text-signal-500">{{ saveError }}</p>

        <div class="mt-6 flex flex-wrap gap-3 justify-end">
          <button type="button" class="btn-outline btn-sm" :disabled="saving" @click="editing = false">
            Cancel
          </button>
          <button
            type="button"
            class="btn-gold"
            :disabled="!canSave || saving"
            @click="saveEdit"
          >
            {{ saving ? 'Saving…' : 'Save changes' }}
          </button>
        </div>
      </template>
    </div>

    <!-- Offer builder — hidden (not unmounted) while editing so unsaved
         prices, modes and periods survive item/qty changes. -->
    <div v-show="!editing">
      <h2 class="admin-section-title mt-10">Make an offer</h2>
      <AdminOfferForm :quote="quote" class="mt-3" @saved="reload" @delete="removeQuote" />
    </div>

    <!-- Offer history -->
    <template v-if="quote.offers.length">
      <h2 class="admin-section-title mt-10">Offer history</h2>
      <div class="admin-list mt-3">
        <div
          v-for="o in [...quote.offers].reverse()"
          :key="o.id"
          class="admin-row flex-wrap text-sm"
          :class="{ 'bg-emerald-500/5': o.confirmedAt }"
        >
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-bone-100">
              Offer #{{ o.id }} · {{ formatMoneyLocal(o.total, o.currency) }}
              <span v-if="o.discountAmount" class="text-bone-400 font-normal">(incl. {{ o.discountType === 'percent' ? `${o.discountValue}%` : formatMoneyLocal(o.discountAmount, o.currency) }} discount)</span>
              <span class="ml-1 text-bone-400 font-normal">{{ o.vatAmount > 0 ? `(incl. ${o.vatRate}% VAT)` : '(no VAT)' }}</span>
              <span v-if="o.confirmedAt" class="admin-chip ml-2 border-emerald-500/50 text-emerald-400">Confirmed</span>
            </p>
            <p class="mt-0.5 text-xs text-bone-400">
              {{ o.sentAt ? `Sent ${formatDateTime(o.sentAt)}` : `Saved ${formatDateTime(o.createdAt)}, not sent` }}
              <span v-if="o.confirmedAt"> · confirmed {{ formatDateTime(o.confirmedAt) }}</span>
            </p>
          </div>
          <button
            v-if="o.confirmedAt"
            type="button"
            class="admin-link"
            :disabled="confirming === o.id"
            @click="setConfirmed(o, false)"
          >
            {{ confirming === o.id ? '…' : 'Undo confirmation' }}
          </button>
          <button
            v-else-if="o.sentAt"
            type="button"
            class="btn-gold btn-sm"
            :disabled="confirming === o.id"
            @click="setConfirmed(o, true)"
          >
            {{ confirming === o.id ? '…' : 'Mark confirmed' }}
          </button>
          <a
            :href="`/api/admin/quotes/${quote.id}/offers/${o.id}`"
            target="_blank"
            class="btn-outline btn-sm"
          >PDF <AdminIcon name="external" :size="14" /></a>
          <NuxtLink
            v-if="contractFor(o.id)"
            :to="`/admin/contracts/${contractFor(o.id)!.id}`"
            class="btn-outline btn-sm"
          >Agreement {{ contractFor(o.id)!.number }}</NuxtLink>
          <button
            v-else
            type="button"
            class="btn-outline btn-sm"
            :disabled="creatingContract === o.id"
            @click="createContract(o)"
          >
            {{ creatingContract === o.id ? 'Creating…' : 'Write agreement' }}
          </button>
        </div>
      </div>
      <p class="mt-3 max-w-3xl text-xs text-ink-400 leading-relaxed">
        Mark the offer the customer accepted as confirmed. Its lines are then counted in
        <NuxtLink to="/admin/rentals" class="text-gold-400 hover:text-gold-500 transition-colors">Rental stats</NuxtLink>
        (times rented and gross per item) and the quote is set to “won”. Only one offer per quote can be confirmed.
        “Write agreement” opens a printable contract prefilled from that offer (see
        <NuxtLink to="/admin/contracts" class="text-gold-400 hover:text-gold-500 transition-colors">Contracts</NuxtLink>).
      </p>
    </template>

    <!-- Agreements made from this quote -->
    <template v-if="contracts.length">
      <h2 class="admin-section-title mt-10">Rental agreements</h2>
      <div class="admin-list mt-3">
        <div v-for="c in contracts" :key="c.id" class="admin-row flex-wrap text-sm">
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-bone-100">
              <NuxtLink :to="`/admin/contracts/${c.id}`" class="admin-row-link">Agreement {{ c.number }}</NuxtLink>
              <span v-if="c.offerId" class="text-bone-400 font-normal"> · from offer #{{ c.offerId }}</span>
            </p>
            <p class="mt-0.5 text-xs text-bone-400">
              {{ c.vehicleCount }} {{ c.vehicleCount === 1 ? 'vehicle' : 'vehicles' }}<span v-if="c.regNos.length"> ({{ c.regNos.join(', ') }})</span>
              · updated {{ formatDateTime(c.updatedAt) }}
            </p>
          </div>
          <div class="admin-row-actions">
            <a :href="`/api/admin/contracts/${c.id}/pdf`" target="_blank" rel="noopener" class="btn-outline btn-sm">PDF <AdminIcon name="external" :size="14" /></a>
            <AdminIcon name="right" :size="16" class="ml-1 text-ink-500" />
          </div>
        </div>
      </div>
    </template>
  </div>

  <AdminStateMessage v-else-if="loadError" kind="error">
    {{ loadError }}
    <template #action>
      <NuxtLink to="/admin/quotes" class="btn-outline btn-sm">Back to quotes</NuxtLink>
    </template>
  </AdminStateMessage>
  <AdminStateMessage v-else kind="loading">Loading…</AdminStateMessage>
</template>

<script setup lang="ts">
import type { LocaleCode, Offer, QuoteDetail, QuoteDraftItem, QuoteStatus, RentalContract, RentalContractSummary } from '~/types'

definePageMeta({ layout: 'admin' })
const { alertDialog, confirmDialog } = useAppDialog()

const route = useRoute()
const quote = ref<QuoteDetail | null>(null)
const loadError = ref('')
const contracts = ref<RentalContractSummary[]>([])

const statusOptions: QuoteStatus[] = ['new', 'offered', 'won', 'lost']

const reload = async () => {
  loadError.value = ''
  try {
    const [q, c] = await Promise.all([
      $fetch<QuoteDetail>(`/api/admin/quotes/${route.params.id}`, { query: { t: Date.now() } }),
      $fetch<RentalContractSummary[]>('/api/admin/contracts', { query: { quoteId: route.params.id, t: Date.now() } }).catch(() => []),
    ])
    quote.value = q
    contracts.value = c
  }
  catch (e: any) {
    loadError.value = e?.statusCode === 404 ? 'Quote request not found.' : 'Could not load the quote request.'
  }
}

onMounted(reload)

// ── Rental agreements ────────────────────────────────────────────────────────

const creatingContract = ref<number | null>(null)
const contractFor = (offerId: number) => contracts.value.find(c => c.offerId === offerId)

const createContract = async (offer: Offer) => {
  if (!quote.value) return
  creatingContract.value = offer.id
  try {
    const c = await $fetch<RentalContract>('/api/admin/contracts', {
      method: 'POST',
      body: { quoteId: quote.value.id, offerId: offer.id },
    })
    await navigateTo(`/admin/contracts/${c.id}`)
  }
  catch (e: any) {
    await alertDialog(e?.data?.statusMessage || 'Could not create the agreement.')
  }
  finally {
    creatingContract.value = null
  }
}

const removeQuote = async () => {
  if (!quote.value) return
  if (!await confirmDialog(`Delete the quote for "${quote.value.name || quote.value.email}"? This also deletes its offers.`)) return
  try {
    await $fetch(`/api/admin/quotes/${quote.value.id}`, { method: 'DELETE' })
    await navigateTo('/admin/quotes')
  }
  catch (e: any) {
    await alertDialog(e?.data?.statusMessage || 'Delete failed.')
  }
}

const setStatus = async (status: QuoteStatus) => {
  if (!quote.value || quote.value.status === status) return
  try {
    await $fetch(`/api/admin/quotes/${quote.value.id}`, { method: 'PATCH', body: { status } })
    quote.value.status = status
  }
  catch (e: any) {
    await alertDialog(e?.data?.statusMessage || 'Could not update status.')
  }
}

// ── Offer confirmation ───────────────────────────────────────────────────────

const confirming = ref<number | null>(null)

const setConfirmed = async (offer: Offer, confirmed: boolean) => {
  if (!quote.value) return
  const alreadyConfirmed = quote.value.offers.find(o => o.confirmedAt && o.id !== offer.id)
  if (confirmed && alreadyConfirmed) {
    const ok = await confirmDialog(`Offer #${alreadyConfirmed.id} is already confirmed. Move the confirmation to offer #${offer.id}?`)
    if (!ok) return
  }
  if (!confirmed && !await confirmDialog(`Undo the confirmation of offer #${offer.id}? It will be removed from the rental statistics.`)) return
  confirming.value = offer.id
  try {
    const res = await $fetch<{ quote: QuoteDetail }>(`/api/admin/quotes/${quote.value.id}/offers/${offer.id}`, {
      method: 'PATCH',
      body: { confirmed },
    })
    quote.value = res.quote
  }
  catch (e: any) {
    await alertDialog(e?.data?.statusMessage || 'Could not update the offer.')
  }
  finally {
    confirming.value = null
  }
}

// ── Edit mode ────────────────────────────────────────────────────────────────

const editing = ref(false)
const saving = ref(false)
const saveError = ref('')
const edit = reactive({
  email: '', name: '', company: '', kennitala: '', phone: '', dates: '',
  locale: 'en' as LocaleCode,
})
const draftItems = ref<QuoteDraftItem[]>([])

const startEdit = () => {
  if (!quote.value) return
  edit.email = quote.value.email
  edit.name = quote.value.name
  edit.company = quote.value.company ?? ''
  edit.kennitala = quote.value.kennitala ?? ''
  edit.phone = quote.value.phone ?? ''
  edit.dates = quote.value.dates ?? ''
  edit.locale = quote.value.locale
  draftItems.value = quote.value.items.map(i => ({
    type: i.itemType, id: i.itemId, qty: i.qty, name: i.name.en, image: i.image, note: i.note,
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
        kennitala: edit.kennitala || undefined,
        phone: edit.phone || undefined,
        dates: edit.dates || undefined,
        locale: edit.locale,
        items: draftItems.value.map(e => ({ type: e.type, id: e.id, qty: e.qty || 1, note: e.note || undefined })),
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

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const formatMoneyLocal = (n: number, currency: string) =>
  currency === 'EUR' ? `€${n.toLocaleString('en-US')}` : `${n.toLocaleString('is-IS')} kr.`

useHead({ title: 'Quote · Admin · Creative Filmmaking' })
</script>
