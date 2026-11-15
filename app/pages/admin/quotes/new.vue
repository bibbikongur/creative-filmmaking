<template>
  <div>
    <AdminPageHeader
      title="New quote"
      description="Pick the recipient and the items. You set the prices on the next step."
      :crumbs="[{ label: 'Sales' }, { label: 'Quotes', to: '/admin/quotes' }, { label: 'New' }]"
    />

    <!-- Recipient -->
    <div class="mt-6 admin-card p-5 sm:p-6">
      <h2 class="admin-card-title">Recipient</h2>
      <div class="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label class="admin-label">Email *</label>
          <input v-model.trim="email" type="email" class="input-dark" placeholder="customer@example.com">
        </div>
        <div>
          <label class="admin-label">Name</label>
          <input v-model.trim="name" type="text" class="input-dark" placeholder="Contact name (optional)">
        </div>
        <div>
          <label class="admin-label">Company</label>
          <input v-model.trim="company" type="text" class="input-dark" placeholder="Optional">
        </div>
        <div>
          <label class="admin-label">Kennitala</label>
          <input v-model.trim="kennitala" type="text" class="input-dark" placeholder="Optional">
        </div>
        <div>
          <label class="admin-label">Phone</label>
          <input v-model.trim="phone" type="text" class="input-dark" placeholder="Optional">
        </div>
        <div>
          <label class="admin-label">Language</label>
          <select v-model="locale" class="input-dark">
            <option value="en">English</option>
            <option value="is">Icelandic</option>
          </select>
          <p class="mt-1 text-[11px] text-bone-400">Controls the offer email + PDF language.</p>
        </div>
        <div>
          <label class="admin-label">Rental period</label>
          <input v-model.trim="dates" type="text" class="input-dark" placeholder="e.g. 12–18 August 2026 (optional)">
        </div>
      </div>
    </div>

    <!-- Item picker -->
    <div class="mt-5 admin-card p-5 sm:p-6">
      <AdminQuoteItemsPicker v-model="selected" />
    </div>

    <p v-if="error" class="mt-4 text-sm text-signal-400" role="alert">{{ error }}</p>

    <div class="admin-savebar mt-5">
      <button
        type="button"
        class="btn-gold"
        :disabled="!canCreate || busy"
        @click="create"
      >
        {{ busy ? 'Creating…' : 'Create quote and set prices' }}
      </button>
      <NuxtLink to="/admin/quotes" class="btn-outline">Cancel</NuxtLink>
      <span class="text-xs" :class="canCreate ? 'text-bone-400' : 'text-ink-400'" role="status">
        {{ canCreate ? `${selected.length} ${selected.length === 1 ? 'item' : 'items'} selected` : !selected.length ? 'Enter the recipient’s email and add at least one item' : 'Enter the recipient’s email to continue' }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LocaleCode, QuoteDraftItem } from '~/types'

definePageMeta({ layout: 'admin' })

const email = ref('')
const name = ref('')
const company = ref('')
const kennitala = ref('')
const phone = ref('')
const dates = ref('')
const locale = ref<LocaleCode>('en')

const selected = ref<QuoteDraftItem[]>([])

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
        kennitala: kennitala.value || undefined,
        phone: phone.value || undefined,
        dates: dates.value || undefined,
        locale: locale.value,
        items: selected.value.map(e => ({ type: e.type, id: e.id, qty: e.qty || 1, note: e.note || undefined })),
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
