<template>
  <div>
    <div>
      <p class="kicker">
        <NuxtLink to="/admin/quotes" class="hover:text-gold-400 transition-colors">Quotes</NuxtLink>
        <span class="text-ink-500 mx-1">/</span> New
      </p>
      <h1 class="mt-2 text-3xl font-semibold uppercase tracking-wide text-bone-100">New quote</h1>
      <p class="mt-2 text-sm text-bone-400">
        Pick the items and the recipient here. On the next step you set the prices (flat or per day) and send the PDF offer.
      </p>
    </div>

    <!-- Recipient -->
    <div class="mt-8 border border-ink-800 bg-ink-900/50 p-5">
      <h2 class="text-xs uppercase tracking-widest text-bone-400">Recipient</h2>
      <div class="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">Email *</label>
          <input v-model.trim="email" type="email" class="input-dark" placeholder="customer@example.com">
        </div>
        <div>
          <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">Name</label>
          <input v-model.trim="name" type="text" class="input-dark" placeholder="Contact name (optional)">
        </div>
        <div>
          <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">Company</label>
          <input v-model.trim="company" type="text" class="input-dark" placeholder="Optional">
        </div>
        <div>
          <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">Phone</label>
          <input v-model.trim="phone" type="text" class="input-dark" placeholder="Optional">
        </div>
        <div>
          <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">Language</label>
          <select v-model="locale" class="input-dark">
            <option value="en">English</option>
            <option value="is">Icelandic</option>
          </select>
          <p class="mt-1 text-[11px] text-bone-400">Controls the offer email + PDF language.</p>
        </div>
        <div>
          <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">Shooting dates</label>
          <input v-model.trim="dates" type="text" class="input-dark" placeholder="e.g. 12–18 August 2026 (optional)">
        </div>
      </div>
    </div>

    <!-- Item picker -->
    <div class="mt-8 border border-ink-800 bg-ink-900/50 p-5">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <h2 class="text-xs uppercase tracking-widest text-bone-400">
          Items <span class="text-gold-400">({{ selected.length }} selected)</span>
        </h2>
        <input
          v-model.trim="search"
          type="search"
          class="input-dark !w-64"
          placeholder="Search vehicles & equipment…"
        >
      </div>

      <p v-if="catalogueError" class="mt-4 text-sm text-signal-500">{{ catalogueError }}</p>
      <p v-else-if="!catalogueLoaded" class="mt-4 text-sm text-bone-400">Loading catalogue…</p>

      <template v-else>
        <!-- Selected -->
        <div v-if="selected.length" class="mt-4 border border-gold-500/30 divide-y divide-ink-800">
          <div v-for="entry in selected" :key="entryKey(entry)" class="flex items-center gap-4 p-3">
            <img
              v-if="entry.item.images[0]"
              :src="entry.item.images[0]"
              :alt="entry.item.name.en"
              class="w-16 h-11 object-cover bg-ink-800 shrink-0"
              loading="lazy"
            >
            <div v-else class="w-16 h-11 bg-ink-800 shrink-0" />
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-bone-100 truncate">{{ entry.item.name.en }}</p>
              <p class="mt-0.5 text-xs uppercase tracking-widest text-bone-400">{{ entry.type }}</p>
            </div>
            <div class="flex items-center gap-2">
              <label class="text-xs uppercase tracking-widest text-bone-400">Qty</label>
              <input
                v-model.number="entry.qty"
                type="number"
                min="1"
                max="99"
                step="1"
                class="input-dark !w-16 text-right"
              >
            </div>
            <button
              type="button"
              class="text-xs uppercase tracking-widest text-signal-500/80 hover:text-signal-500 transition-colors"
              @click="toggle(entry.type, entry.item)"
            >
              Remove
            </button>
          </div>
        </div>

        <!-- Catalogue -->
        <div class="mt-4 grid gap-x-8 gap-y-6 lg:grid-cols-2">
          <div v-for="group in groups" :key="group.label">
            <h3 class="text-xs uppercase tracking-widest text-bone-400">{{ group.label }}</h3>
            <div class="mt-2 border border-ink-800 divide-y divide-ink-800 max-h-96 overflow-y-auto">
              <button
                v-for="row in group.rows"
                :key="row.item.id"
                type="button"
                class="w-full flex items-center gap-3 p-2.5 text-left transition-colors"
                :class="isSelected(row.type, row.item.id) ? 'bg-gold-500/10' : 'hover:bg-ink-900'"
                @click="toggle(row.type, row.item)"
              >
                <img
                  v-if="row.item.images[0]"
                  :src="row.item.images[0]"
                  :alt="row.item.name.en"
                  class="w-14 h-10 object-cover bg-ink-800 shrink-0"
                  loading="lazy"
                >
                <div v-else class="w-14 h-10 bg-ink-800 shrink-0" />
                <span class="min-w-0 flex-1 text-sm text-bone-100 truncate">{{ row.item.name.en }}</span>
                <span class="text-xs uppercase tracking-widest shrink-0" :class="isSelected(row.type, row.item.id) ? 'text-gold-400' : 'text-bone-400'">
                  {{ isSelected(row.type, row.item.id) ? '✓ Added' : '+ Add' }}
                </span>
              </button>
              <p v-if="!group.rows.length" class="p-4 text-xs text-bone-400">No matches.</p>
            </div>
          </div>
        </div>
      </template>
    </div>

    <p v-if="error" class="mt-4 text-sm text-signal-500">{{ error }}</p>

    <div class="mt-6 flex justify-end">
      <button
        type="button"
        class="btn-gold !px-5 !py-2.5 disabled:opacity-50"
        :disabled="!canCreate || busy"
        @click="create"
      >
        {{ busy ? 'Creating…' : 'Create quote & set prices' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CartItemType, EquipmentItem, LocaleCode, Vehicle } from '~/types'

definePageMeta({ layout: 'admin' })

const email = ref('')
const name = ref('')
const company = ref('')
const phone = ref('')
const dates = ref('')
const locale = ref<LocaleCode>('en')

const vehicles = ref<Vehicle[]>([])
const equipment = ref<EquipmentItem[]>([])
const catalogueLoaded = ref(false)
const catalogueError = ref('')

onMounted(async () => {
  try {
    ;[vehicles.value, equipment.value] = await Promise.all([
      $fetch<Vehicle[]>('/api/vehicles'),
      $fetch<EquipmentItem[]>('/api/equipment'),
    ])
    catalogueLoaded.value = true
  }
  catch {
    catalogueError.value = 'Could not load the catalogue. Is the server running?'
  }
})

interface SelectedEntry {
  type: CartItemType
  item: Vehicle | EquipmentItem
  qty: number
}

const selected = ref<SelectedEntry[]>([])
const entryKey = (e: SelectedEntry) => `${e.type}:${e.item.id}`
const isSelected = (type: CartItemType, id: string) =>
  selected.value.some(e => e.type === type && e.item.id === id)

const toggle = (type: CartItemType, item: Vehicle | EquipmentItem) => {
  const idx = selected.value.findIndex(e => e.type === type && e.item.id === item.id)
  if (idx >= 0) selected.value.splice(idx, 1)
  else selected.value.push({ type, item, qty: 1 })
}

const search = ref('')
const matches = (item: Vehicle | EquipmentItem) => {
  const q = search.value.toLowerCase()
  return !q || item.name.en.toLowerCase().includes(q) || item.name.is.toLowerCase().includes(q)
}
const groups = computed(() => [
  { label: 'Vehicles', rows: vehicles.value.filter(matches).map(item => ({ type: 'vehicle' as const, item })) },
  { label: 'Equipment', rows: equipment.value.filter(matches).map(item => ({ type: 'equipment' as const, item })) },
])

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const canCreate = computed(() => EMAIL_RE.test(email.value) && selected.value.length > 0)

const busy = ref(false)
const error = ref('')

const create = async () => {
  busy.value = true
  error.value = ''
  try {
    const res = await $fetch<{ id: string }>('/api/admin/quotes', {
      method: 'POST',
      body: {
        email: email.value,
        name: name.value || undefined,
        company: company.value || undefined,
        phone: phone.value || undefined,
        dates: dates.value || undefined,
        locale: locale.value,
        items: selected.value.map(e => ({ type: e.type, id: e.item.id, qty: e.qty || 1 })),
      },
    })
    await navigateTo(`/admin/quotes/${res.id}`)
  }
  catch (e: any) {
    error.value = e?.data?.data?.errors?.join(' ') || e?.data?.statusMessage || 'Could not create the quote.'
  }
  finally {
    busy.value = false
  }
}

useHead({ title: 'New quote · Admin · Creative Filmmaking' })
</script>
