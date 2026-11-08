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
            <p class="text-xs uppercase tracking-widest text-bone-400">Kennitala</p>
            <p class="mt-1 text-bone-100">{{ quote.kennitala || '–' }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-widest text-bone-400">Rental period</p>
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
            <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">Kennitala</label>
            <input v-model.trim="edit.kennitala" type="text" class="input-dark" placeholder="Optional">
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
            <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">Rental period</label>
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

    <!-- Offer builder — hidden (not unmounted) while editing so unsaved
         prices, modes and periods survive item/qty changes. -->
    <div v-show="!editing">
      <h2 class="mt-12 text-xl font-semibold uppercase tracking-wide text-bone-100">Make an offer</h2>
      <AdminOfferForm :quote="quote" class="mt-5" @saved="reload" />
    </div>

    <!-- Offer history -->
    <template v-if="quote.offers.length">
      <h2 class="mt-12 text-xl font-semibold uppercase tracking-wide text-bone-100">Offer history</h2>
      <div class="mt-5 border border-ink-800 divide-y divide-ink-800">
        <div
          v-for="o in [...quote.offers].reverse()"
          :key="o.id"
          class="flex flex-wrap items-center gap-4 p-4 text-sm"
          :class="o.confirmedAt ? 'bg-emerald-500/5' : 'bg-ink-900/50'"
        >
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-bone-100">
              Offer #{{ o.id }} · {{ formatMoneyLocal(o.total, o.currency) }}
              <span v-if="o.discountAmount" class="text-bone-400 font-normal">(incl. {{ o.discountType === 'percent' ? `${o.discountValue}%` : formatMoneyLocal(o.discountAmount, o.currency) }} discount)</span>
              <span class="ml-1 text-bone-400 font-normal">{{ o.vatAmount > 0 ? `(incl. ${o.vatRate}% VAT)` : '(no VAT)' }}</span>
              <span v-if="o.confirmedAt" class="ml-2 text-[10px] uppercase tracking-widest text-emerald-400 border border-emerald-500/50 px-1.5 py-0.5 font-normal">Confirmed</span>
            </p>
            <p class="mt-0.5 text-xs text-bone-400">
              {{ o.sentAt ? `Sent ${formatDateTime(o.sentAt)}` : `Saved ${formatDateTime(o.createdAt)}, not sent` }}
              <span v-if="o.confirmedAt"> · confirmed {{ formatDateTime(o.confirmedAt) }}</span>
            </p>
          </div>
          <button
            v-if="o.confirmedAt"
            type="button"
            class="text-xs uppercase tracking-widest text-bone-400 hover:text-signal-500 transition-colors disabled:opacity-50"
            :disabled="confirming === o.id"
            @click="setConfirmed(o, false)"
          >
            {{ confirming === o.id ? '…' : 'Undo confirmation' }}
          </button>
          <button
            v-else-if="o.sentAt"
            type="button"
            class="btn-gold !px-4 !py-2 !text-xs disabled:opacity-50"
            :disabled="confirming === o.id"
            @click="setConfirmed(o, true)"
          >
            {{ confirming === o.id ? '…' : 'Mark confirmed' }}
          </button>
          <a
            :href="`/api/admin/quotes/${quote.id}/offers/${o.id}`"
            target="_blank"
            class="btn-ghost !px-4 !py-2 !text-xs"
          >PDF ↗</a>
          <NuxtLink
            v-if="contractFor(o.id)"
            :to="`/admin/contracts/${contractFor(o.id)!.id}`"
            class="btn-ghost !px-4 !py-2 !text-xs"
          >Agreement {{ contractFor(o.id)!.number }} →</NuxtLink>
          <button
            v-else
            type="button"
            class="btn-ghost !px-4 !py-2 !text-xs disabled:opacity-50"
            :disabled="creatingContract === o.id"
            @click="createContract(o)"
          >
            {{ creatingContract === o.id ? '…' : 'Rental agreement →' }}
          </button>
        </div>
      </div>
      <p class="mt-3 text-xs text-bone-400 leading-relaxed">
        Mark the offer the customer accepted as confirmed. Its lines are then counted in
        <NuxtLink to="/admin/rentals" class="text-gold-400 hover:text-gold-500 transition-colors">Rentals</NuxtLink>
        (times rented and gross per item) and the quote is set to “won”. Only one offer per quote can be confirmed.
        “Rental agreement” opens a printable contract prefilled from that offer (see
        <NuxtLink to="/admin/contracts" class="text-gold-400 hover:text-gold-500 transition-colors">Contracts</NuxtLink>).
      </p>
    </template>

    <!-- Agreements made from this quote -->
    <template v-if="contracts.length">
      <h2 class="mt-12 text-xl font-semibold uppercase tracking-wide text-bone-100">Rental agreements</h2>
      <div class="mt-5 border border-ink-800 divide-y divide-ink-800">
        <div v-for="c in contracts" :key="c.id" class="flex flex-wrap items-center gap-4 p-4 text-sm bg-ink-900/50">
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-bone-100">
              <span class="font-mono text-gold-400">{{ c.number }}</span>
              <span v-if="c.offerId" class="text-bone-400 font-normal"> · from offer #{{ c.offerId }}</span>
            </p>
            <p class="mt-0.5 text-xs text-bone-400">
              {{ c.vehicleCount }} {{ c.vehicleCount === 1 ? 'vehicle' : 'vehicles' }}<span v-if="c.regNos.length"> ({{ c.regNos.join(', ') }})</span>
              · updated {{ formatDateTime(c.updatedAt) }}
            </p>
          </div>
          <NuxtLink :to="`/admin/contracts/${c.id}`" class="btn-ghost !px-4 !py-2 !text-xs">Edit</NuxtLink>
          <a :href="`/api/admin/contracts/${c.id}/pdf`" target="_blank" class="btn-ghost !px-4 !py-2 !text-xs">Print ↗</a>
        </div>
      </div>
    </template>
  </div>

  <p v-else-if="loadError" class="text-sm text-signal-500">{{ loadError }}</p>
  <p v-else class="text-sm text-bone-400">Loading…</p>
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
