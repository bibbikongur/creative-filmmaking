<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="kicker">Timesheets</p>
        <h1 class="mt-2 text-3xl font-semibold uppercase tracking-wide text-bone-100">Production companies</h1>
      </div>
    </div>

    <!-- Create company -->
    <form class="mt-8 border border-ink-800 bg-ink-900/50 p-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" @submit.prevent="create">
      <div>
        <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">Company name</label>
        <input v-model="form.name" type="text" class="input-dark" required>
      </div>
      <div>
        <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">Admin email</label>
        <input v-model="form.adminEmail" type="email" class="input-dark" required>
      </div>
      <div>
        <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">Admin name (optional)</label>
        <input v-model="form.adminName" type="text" class="input-dark">
      </div>
      <div class="flex items-end gap-3">
        <div class="flex-1">
          <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">Invite language</label>
          <select v-model="form.locale" class="input-dark">
            <option value="is">Íslenska</option>
            <option value="en">English</option>
          </select>
        </div>
        <button type="submit" class="btn-gold whitespace-nowrap disabled:opacity-60" :disabled="creating">
          {{ creating ? 'Creating…' : 'Create + invite' }}
        </button>
      </div>
      <ul v-if="createErrors.length" class="sm:col-span-2 lg:col-span-4 text-sm text-signal-500 list-disc pl-5">
        <li v-for="err in createErrors" :key="err">{{ err }}</li>
      </ul>
    </form>

    <p v-if="loadError" class="mt-8 text-sm text-signal-500">{{ loadError }}</p>
    <p v-else-if="!loaded" class="mt-8 text-sm text-bone-400">Loading companies…</p>

    <div v-else class="mt-8 border border-ink-800 divide-y divide-ink-800">
      <div
        v-for="c in companies"
        :key="c.id"
        class="flex flex-wrap items-center gap-4 p-4 bg-ink-900/50 hover:bg-ink-900 transition-colors"
      >
        <div class="min-w-0 flex-1">
          <p class="font-semibold text-bone-100 truncate">
            {{ c.name }}
            <span v-if="c.status === 'disabled'" class="ml-2 text-xs uppercase tracking-widest text-signal-500">Disabled</span>
          </p>
          <p class="mt-0.5 text-xs text-bone-400 truncate">
            {{ formatDate(c.createdAt) }} · {{ c.adminEmail || 'no admin' }}
            <span v-if="c.adminStatus === 'invited'" class="text-gold-400"> (invite pending)</span>
            · {{ c.jobCount }} {{ c.jobCount === 1 ? 'job' : 'jobs' }}
            · {{ c.employeeCount }} {{ c.employeeCount === 1 ? 'employee' : 'employees' }}
          </p>
        </div>
        <button
          v-if="c.adminStatus === 'invited'"
          type="button"
          class="text-xs uppercase tracking-widest text-bone-400 hover:text-gold-400 transition-colors disabled:opacity-50"
          :disabled="busy === c.id"
          @click="reinvite(c)"
        >
          Resend invite
        </button>
        <button
          type="button"
          class="text-xs uppercase tracking-widest text-bone-400 hover:text-gold-400 transition-colors disabled:opacity-50"
          :disabled="busy === c.id"
          @click="toggleStatus(c)"
        >
          {{ c.status === 'active' ? 'Disable' : 'Enable' }}
        </button>
        <button
          type="button"
          class="text-xs uppercase tracking-widest text-signal-500/80 hover:text-signal-500 transition-colors disabled:opacity-50"
          :disabled="busy === c.id"
          @click="remove(c)"
        >
          {{ busy === c.id ? '…' : 'Delete' }}
        </button>
      </div>

      <p v-if="!companies.length" class="p-8 text-center text-sm text-bone-400">
        No companies yet. Create one above and its admin gets an email to set a password
        and can then manage jobs, staff and timesheets at /portal.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CompanySummary } from '~/types'

definePageMeta({ layout: 'admin' })

const companies = ref<CompanySummary[]>([])
const loaded = ref(false)
const loadError = ref('')
const busy = ref('')
const creating = ref(false)
const createErrors = ref<string[]>([])

const form = reactive({ name: '', adminEmail: '', adminName: '', locale: 'is' })

const load = async () => {
  loadError.value = ''
  try {
    companies.value = await $fetch<CompanySummary[]>('/api/admin/companies', { query: { t: Date.now() } })
    loaded.value = true
  }
  catch {
    loadError.value = 'Could not load companies. Is the server running?'
  }
}

onMounted(load)

const create = async () => {
  createErrors.value = []
  creating.value = true
  try {
    await $fetch('/api/admin/companies', { method: 'POST', body: { ...form } })
    form.name = ''
    form.adminEmail = ''
    form.adminName = ''
    await load()
  }
  catch (e: any) {
    createErrors.value = e?.data?.data?.errors || [e?.data?.statusMessage || 'Could not create the company.']
  }
  finally {
    creating.value = false
  }
}

const reinvite = async (c: CompanySummary) => {
  busy.value = c.id
  try {
    await $fetch(`/api/admin/companies/${c.id}/reinvite`, { method: 'POST' })
    alert(`Invite resent to ${c.adminEmail}.`)
  }
  catch (e: any) {
    alert(e?.data?.statusMessage || 'Could not resend the invite.')
  }
  finally {
    busy.value = ''
  }
}

const toggleStatus = async (c: CompanySummary) => {
  const next = c.status === 'active' ? 'disabled' : 'active'
  if (next === 'disabled' && !confirm(`Disable "${c.name}"? All its portal users lose access until re-enabled.`)) return
  busy.value = c.id
  try {
    await $fetch(`/api/admin/companies/${c.id}`, { method: 'PATCH', body: { status: next } })
    c.status = next
  }
  catch (e: any) {
    alert(e?.data?.statusMessage || 'Update failed.')
  }
  finally {
    busy.value = ''
  }
}

const remove = async (c: CompanySummary) => {
  if (!confirm(`Delete "${c.name}"? This permanently deletes its jobs, staff links and all timesheets.`)) return
  busy.value = c.id
  try {
    await $fetch(`/api/admin/companies/${c.id}`, { method: 'DELETE' })
    companies.value = companies.value.filter(x => x.id !== c.id)
  }
  catch (e: any) {
    alert(e?.data?.statusMessage || 'Delete failed.')
  }
  finally {
    busy.value = ''
  }
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

useHead({ title: 'Companies · Admin · Creative Filmmaking' })
</script>
