<template>
  <div>
    <div>
      <p class="kicker">
        <NuxtLink to="/admin/quotes" class="hover:text-gold-400 transition-colors">Quotes</NuxtLink>
        <span class="text-ink-500 mx-1">/</span> New
      </p>
      <h1 class="mt-2 text-3xl font-semibold uppercase tracking-wide text-bone-100">New quote</h1>
      <p class="mt-2 text-sm text-bone-400">
        Pick the items and the recipient here. Everything stays editable on the next step, right up until you send the offer.
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
          <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">Kennitala</label>
          <input v-model.trim="kennitala" type="text" class="input-dark" placeholder="Optional">
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
      <AdminQuoteItemsPicker v-model="selected" />
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
        items: selected.value.map(e => ({ type: e.type, id: e.id, qty: e.qty || 1 })),
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
