<template>
  <div>
    <AdminPageHeader
      stack-actions
      title="Portal companies"
      description="Production companies that use the crew portal for jobs, staff and timesheets."
      :crumbs="[{ label: 'Access' }, { label: 'Portal companies' }]"
    >
      <template #actions>
        <a href="/portal" target="_blank" rel="noopener" class="btn-outline btn-sm">Open portal <AdminIcon name="external" :size="16" /></a>
        <button type="button" class="btn-sm" :class="showForm ? 'btn-outline' : 'btn-gold'" :aria-expanded="showForm" aria-controls="invite-form" @click="showForm = !showForm">
          <AdminIcon :name="showForm ? 'close' : 'plus'" :size="16" /> {{ showForm ? 'Close' : 'Invite company' }}
        </button>
      </template>
    </AdminPageHeader>

    <!-- Create company -->
    <form v-if="showForm" id="invite-form" class="admin-card rail-top mt-6 p-5 sm:p-6" aria-labelledby="invite-company" @submit.prevent="create">
      <h2 id="invite-company" class="admin-card-title">Invite a company</h2>
      <div class="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-[repeat(3,minmax(0,1fr))_9rem_auto] xl:items-end">
        <div>
          <label for="co-name" class="admin-label">Company name</label>
          <input id="co-name" v-model="form.name" type="text" class="input-dark" required>
        </div>
        <div>
          <label for="co-email" class="admin-label">Admin email</label>
          <input id="co-email" v-model="form.adminEmail" type="email" class="input-dark" required>
        </div>
        <div>
          <label for="co-admin" class="admin-label">Admin name <span class="normal-case tracking-normal text-ink-400">(optional)</span></label>
          <input id="co-admin" v-model="form.adminName" type="text" class="input-dark">
        </div>
        <div>
          <label for="co-locale" class="admin-label">Invite language</label>
          <select id="co-locale" v-model="form.locale" class="input-dark">
            <option value="is">Íslenska</option>
            <option value="en">English</option>
          </select>
        </div>
        <button type="submit" class="btn-gold whitespace-nowrap sm:col-span-2 sm:justify-self-start xl:col-span-1" :disabled="creating">
          {{ creating ? 'Creating…' : 'Create and invite' }}
        </button>
      </div>
      <p class="mt-3 text-xs leading-relaxed text-ink-400">The admin gets an email with a link to set a password.</p>
      <ul v-if="createErrors.length" class="mt-3 list-disc pl-5 text-sm text-signal-400" role="alert">
        <li v-for="err in createErrors" :key="err">{{ err }}</li>
      </ul>
    </form>

    <AdminStateMessage v-if="loadError" kind="error" class="mt-6">{{ loadError }}</AdminStateMessage>
    <AdminStateMessage v-else-if="!loaded" kind="loading" class="mt-6">Loading companies…</AdminStateMessage>

    <AdminStateMessage v-else-if="!companies.length" title="No companies yet" class="mt-6">
      Invite one and its admin gets an email to set a password. They can then manage jobs, staff and timesheets at /portal.
      <template v-if="!showForm" #action>
        <button type="button" class="btn-outline btn-sm" @click="showForm = true">Invite company</button>
      </template>
    </AdminStateMessage>

    <template v-else>
      <AdminToolbar class="mt-6" :count="`${companies.length} ${companies.length === 1 ? 'company' : 'companies'}`" />

      <div class="admin-list mt-4">
        <div class="admin-list-head hidden md:grid" :class="cols">
          <span>Company</span>
          <span>Admin</span>
          <span class="text-right">Jobs</span>
          <span class="text-right">Crew</span>
          <span class="text-right">Actions</span>
        </div>

        <div v-for="c in companies" :key="c.id" class="admin-row flex-wrap md:grid" :class="[cols, { 'opacity-60': c.status === 'disabled' }]">
          <div class="min-w-0 flex-1 basis-full md:basis-auto">
            <p class="flex items-center gap-2">
              <span class="truncate font-semibold text-bone-100">{{ c.name }}</span>
              <span v-if="c.status === 'disabled'" class="admin-chip border-signal-500/50 text-signal-400">Disabled</span>
            </p>
            <p class="mt-0.5 truncate text-xs text-ink-400">
              Added {{ formatDate(c.createdAt) }}
              <span class="md:hidden"> · {{ c.jobCount }} {{ c.jobCount === 1 ? 'job' : 'jobs' }} · {{ c.employeeCount }} crew</span>
            </p>
          </div>
          <div class="min-w-0 flex-1 md:flex-none">
            <p class="truncate text-sm text-bone-400">{{ c.adminEmail || 'No admin' }}</p>
            <p v-if="c.adminStatus === 'invited'" class="mt-0.5 text-xs text-gold-400">Invite pending</p>
          </div>
          <p class="hidden md:block text-right text-sm tabular-nums text-bone-400">{{ c.jobCount }}</p>
          <p class="hidden md:block text-right text-sm tabular-nums text-bone-400">{{ c.employeeCount }}</p>
          <div class="admin-row-actions">
            <button
              v-if="c.adminStatus === 'invited'"
              type="button"
              class="admin-icon-action"
              :disabled="busy === c.id"
              :aria-label="`Resend the invite to ${c.adminEmail}`"
              title="Resend invite"
              @click="reinvite(c)"
            >
              <AdminIcon name="mail" />
            </button>
            <button type="button" class="btn-outline btn-sm w-[5.5rem]" :disabled="busy === c.id" @click="toggleStatus(c)">
              {{ c.status === 'active' ? 'Disable' : 'Enable' }}
            </button>
            <button
              type="button"
              class="admin-icon-action-danger"
              :disabled="busy === c.id"
              :aria-label="`Delete ${c.name}`"
              title="Delete"
              @click="remove(c)"
            >
              <AdminIcon name="trash" />
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { CompanySummary } from '~/types'

definePageMeta({ layout: 'admin' })
const { confirmDialog, alertDialog } = useAppDialog()

const companies = ref<CompanySummary[]>([])
const loaded = ref(false)
const loadError = ref('')
const busy = ref('')
const creating = ref(false)
const createErrors = ref<string[]>([])

const cols = 'md:grid-cols-[minmax(0,1fr)_minmax(0,14rem)_3.5rem_3.5rem_10.5rem]'

const showForm = ref(false)
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
    showForm.value = false
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
    await alertDialog(`Invite resent to ${c.adminEmail}.`)
  }
  catch (e: any) {
    await alertDialog(e?.data?.statusMessage || 'Could not resend the invite.')
  }
  finally {
    busy.value = ''
  }
}

const toggleStatus = async (c: CompanySummary) => {
  const next = c.status === 'active' ? 'disabled' : 'active'
  if (next === 'disabled' && !await confirmDialog(`Disable "${c.name}"? All its portal users lose access until re-enabled.`)) return
  busy.value = c.id
  try {
    await $fetch(`/api/admin/companies/${c.id}`, { method: 'PATCH', body: { status: next } })
    c.status = next
  }
  catch (e: any) {
    await alertDialog(e?.data?.statusMessage || 'Update failed.')
  }
  finally {
    busy.value = ''
  }
}

const remove = async (c: CompanySummary) => {
  if (!await confirmDialog(`Delete "${c.name}"? This permanently deletes its jobs, staff links and all timesheets.`)) return
  busy.value = c.id
  try {
    await $fetch(`/api/admin/companies/${c.id}`, { method: 'DELETE' })
    companies.value = companies.value.filter(x => x.id !== c.id)
  }
  catch (e: any) {
    await alertDialog(e?.data?.statusMessage || 'Delete failed.')
  }
  finally {
    busy.value = ''
  }
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

useHead({ title: 'Portal companies · Admin · Creative Filmmaking' })
</script>
