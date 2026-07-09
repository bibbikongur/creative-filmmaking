<template>
  <div>
    <p v-if="loadError" class="text-sm text-signal-500">{{ loadError }}</p>
    <p v-else-if="!loaded" class="text-sm text-bone-400">{{ $t('portal.loading') }}</p>

    <template v-else>
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="kicker">{{ $t('portal.nav.jobs') }}</p>
          <h1 class="mt-2 text-3xl font-semibold uppercase tracking-wide text-bone-100">
            {{ job?.name }}
            <span v-if="job?.status === 'closed'" class="ml-2 text-sm align-middle uppercase tracking-widest text-bone-400">{{ $t('portal.jobs.closed') }}</span>
          </h1>
        </div>
        <NuxtLink :to="localePath('/portal/jobs')" class="text-xs uppercase tracking-widest text-bone-400 hover:text-gold-400 transition-colors">
          ← {{ $t('portal.back') }}
        </NuxtLink>
      </div>

      <!-- Departments -->
      <div v-if="job?.status === 'active'" class="mt-8 border border-ink-800 bg-ink-900/50 p-5">
        <div class="flex items-center justify-between gap-4">
          <p class="kicker">{{ $t('portal.departments.title') }}</p>
          <span class="text-xs text-bone-400">{{ $t('portal.departments.hint') }}</span>
        </div>
        <div class="mt-4 flex flex-wrap gap-2">
          <span
            v-for="d in departments"
            :key="d.id"
            class="inline-flex items-center gap-2 border border-ink-700 px-3 py-1.5 text-sm text-bone-100"
          >
            {{ d.name }}
            <span class="text-xs text-bone-400">{{ d.memberCount }}</span>
            <button type="button" class="text-bone-400 hover:text-gold-400 transition-colors" @click="renameDepartment(d)">✎</button>
            <button type="button" class="text-signal-500/70 hover:text-signal-500 transition-colors" @click="removeDepartment(d)">✕</button>
          </span>
          <form class="inline-flex items-center gap-2" @submit.prevent="createDepartment">
            <input v-model="newDeptName" type="text" class="input-dark !w-44 !py-1.5" :placeholder="$t('portal.departments.namePlaceholder')">
            <button type="submit" class="btn-ghost !py-1.5" :disabled="!newDeptName.trim() || creatingDept">+</button>
          </form>
        </div>
      </div>

      <!-- Add member -->
      <form v-if="job?.status === 'active'" class="mt-6 border border-ink-800 bg-ink-900/50 p-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-6" @submit.prevent="add">
        <div>
          <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.members.email') }}</label>
          <input v-model="form.email" type="email" class="input-dark" required>
        </div>
        <div>
          <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.members.name') }}</label>
          <input v-model="form.name" type="text" class="input-dark">
        </div>
        <div>
          <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.members.dayRate') }}</label>
          <input v-model.number="form.dayRate" type="number" min="1" step="1" class="input-dark text-right" required>
        </div>
        <div>
          <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.departments.department') }}</label>
          <select v-model="form.departmentId" class="input-dark">
            <option :value="null">{{ $t('portal.departments.unassigned') }}</option>
            <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.members.language') }}</label>
          <select v-model="form.locale" class="input-dark">
            <option value="is">Íslenska</option>
            <option value="en">English</option>
          </select>
        </div>
        <div class="flex items-end">
          <button type="submit" class="btn-gold w-full disabled:opacity-60" :disabled="adding">
            {{ adding ? '…' : $t('portal.members.add') }}
          </button>
        </div>
        <label v-if="form.departmentId" class="sm:col-span-2 lg:col-span-6 flex items-center gap-2 text-sm text-bone-400">
          <input v-model="form.isDeptAdmin" type="checkbox" class="accent-gold-500">
          {{ $t('portal.departments.makeAdmin') }}
        </label>
        <ul v-if="addErrors.length" class="sm:col-span-2 lg:col-span-6 text-sm text-signal-500 list-disc pl-5">
          <li v-for="err in addErrors" :key="err">{{ err }}</li>
        </ul>
      </form>

      <!-- Members -->
      <div class="mt-8 border border-ink-800 divide-y divide-ink-800">
        <div
          v-for="m in members"
          :key="m.userId"
          class="flex flex-wrap items-center gap-4 p-4 bg-ink-900/50 transition-colors"
          :class="m.memberStatus === 'removed' ? 'opacity-50' : 'hover:bg-ink-900'"
        >
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-bone-100 truncate">
              {{ m.name || m.email }}
              <span v-if="m.userStatus === 'invited'" class="ml-2 text-xs uppercase tracking-widest text-gold-400">{{ $t('portal.members.invited') }}</span>
              <span v-if="m.memberStatus === 'removed'" class="ml-2 text-xs uppercase tracking-widest text-signal-500">{{ $t('portal.members.removed') }}</span>
              <span v-if="m.isDeptAdmin" class="ml-2 text-xs uppercase tracking-widest text-sky-400">{{ $t('portal.departments.deptAdmin') }}</span>
            </p>
            <p class="mt-0.5 text-xs text-bone-400 truncate">{{ m.email }}</p>
          </div>
          <div v-if="m.memberStatus === 'active'" class="flex items-center gap-2">
            <select
              :value="m.departmentId ?? ''"
              class="input-dark !w-40 !py-1.5"
              @change="setDepartment(m, ($event.target as HTMLSelectElement).value || null)"
            >
              <option value="">{{ $t('portal.departments.unassigned') }}</option>
              <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
            </select>
            <label v-if="m.departmentId" class="flex items-center gap-1 text-xs text-bone-400 whitespace-nowrap">
              <input
                type="checkbox"
                class="accent-gold-500"
                :checked="m.isDeptAdmin"
                :disabled="busy === m.userId"
                @change="setDeptAdmin(m, ($event.target as HTMLInputElement).checked)"
              >
              {{ $t('portal.departments.admin') }}
            </label>
          </div>
          <div class="flex items-center gap-2">
            <input
              v-model.number="rates[m.userId]"
              type="number"
              min="1"
              step="1"
              class="input-dark !w-28 text-right"
              :disabled="m.memberStatus === 'removed'"
            >
            <span class="text-xs text-bone-400">kr.</span>
            <button
              v-if="rates[m.userId] !== m.dayRate"
              type="button"
              class="text-xs uppercase tracking-widest text-gold-400 hover:text-gold-500 transition-colors disabled:opacity-50"
              :disabled="busy === m.userId"
              @click="saveRate(m)"
            >
              {{ $t('portal.save') }}
            </button>
          </div>
          <button
            v-if="m.userStatus === 'invited' && m.memberStatus === 'active'"
            type="button"
            class="text-xs uppercase tracking-widest text-bone-400 hover:text-gold-400 transition-colors disabled:opacity-50"
            :disabled="busy === m.userId"
            @click="reinvite(m)"
          >
            {{ $t('portal.members.reinvite') }}
          </button>
          <button
            type="button"
            class="text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
            :class="m.memberStatus === 'active' ? 'text-signal-500/80 hover:text-signal-500' : 'text-bone-400 hover:text-gold-400'"
            :disabled="busy === m.userId"
            @click="toggleMember(m)"
          >
            {{ m.memberStatus === 'active' ? $t('portal.members.remove') : $t('portal.members.restore') }}
          </button>
        </div>

        <p v-if="!members.length" class="p-8 text-center text-sm text-bone-400">{{ $t('portal.members.empty') }}</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Department, Job, JobMember } from '~/types'

definePageMeta({ layout: 'portal' })

const route = useRoute()
const localePath = useLocalePath()
const { t } = useI18n()
const jobId = computed(() => String(route.params.id))

const job = ref<Job | null>(null)
const members = ref<JobMember[]>([])
const departments = ref<Department[]>([])
const rates = reactive<Record<string, number>>({})
const loaded = ref(false)
const loadError = ref('')
const adding = ref(false)
const addErrors = ref<string[]>([])
const busy = ref('')
const newDeptName = ref('')
const creatingDept = ref(false)

const form = reactive({
  email: '', name: '', dayRate: undefined as number | undefined, locale: 'is',
  departmentId: null as string | null, isDeptAdmin: false,
})

const load = async () => {
  loadError.value = ''
  try {
    const res = await $fetch<{ job: Job, members: JobMember[], departments: Department[] }>(
      `/api/portal/jobs/${jobId.value}/members`, { query: { t: Date.now() } })
    job.value = res.job
    members.value = res.members
    departments.value = res.departments
    for (const m of res.members) rates[m.userId] = m.dayRate
    loaded.value = true
  }
  catch (e: any) {
    loadError.value = e?.data?.statusMessage || t('portal.loadFailed')
  }
}

onMounted(load)

const add = async () => {
  addErrors.value = []
  adding.value = true
  try {
    await $fetch(`/api/portal/jobs/${jobId.value}/members`, { method: 'POST', body: { ...form } })
    form.email = ''
    form.name = ''
    form.dayRate = undefined
    form.departmentId = null
    form.isDeptAdmin = false
    await load()
  }
  catch (e: any) {
    addErrors.value = e?.data?.data?.errors || [e?.data?.statusMessage || t('portal.loadFailed')]
  }
  finally {
    adding.value = false
  }
}

// ── Departments ──
const createDepartment = async () => {
  if (!newDeptName.value.trim()) return
  creatingDept.value = true
  try {
    await $fetch(`/api/portal/jobs/${jobId.value}/departments`, { method: 'POST', body: { name: newDeptName.value } })
    newDeptName.value = ''
    await load()
  }
  catch (e: any) {
    alert(e?.data?.data?.errors?.[0] || e?.data?.statusMessage || t('portal.loadFailed'))
  }
  finally {
    creatingDept.value = false
  }
}

const renameDepartment = async (d: Department) => {
  const name = prompt(t('portal.departments.renamePrompt'), d.name)
  if (!name || name.trim() === d.name) return
  try {
    await $fetch(`/api/portal/jobs/${jobId.value}/departments/${d.id}`, { method: 'PATCH', body: { name } })
    await load()
  }
  catch (e: any) {
    alert(e?.data?.data?.errors?.[0] || e?.data?.statusMessage || t('portal.loadFailed'))
  }
}

const removeDepartment = async (d: Department) => {
  if (!confirm(t('portal.departments.deleteConfirm', { name: d.name }))) return
  try {
    await $fetch(`/api/portal/jobs/${jobId.value}/departments/${d.id}`, { method: 'DELETE' })
    await load()
  }
  catch (e: any) {
    alert(e?.data?.statusMessage || t('portal.loadFailed'))
  }
}

const setDepartment = async (m: JobMember, departmentId: string | null) => {
  busy.value = m.userId
  try {
    await $fetch(`/api/portal/jobs/${jobId.value}/members/${m.userId}`, { method: 'PATCH', body: { departmentId } })
    await load()
  }
  catch (e: any) {
    alert(e?.data?.statusMessage || t('portal.loadFailed'))
  }
  finally {
    busy.value = ''
  }
}

const setDeptAdmin = async (m: JobMember, isDeptAdmin: boolean) => {
  busy.value = m.userId
  try {
    await $fetch(`/api/portal/jobs/${jobId.value}/members/${m.userId}`, { method: 'PATCH', body: { isDeptAdmin } })
    await load()
  }
  catch (e: any) {
    alert(e?.data?.statusMessage || t('portal.loadFailed'))
  }
  finally {
    busy.value = ''
  }
}

const saveRate = async (m: JobMember) => {
  busy.value = m.userId
  try {
    await $fetch(`/api/portal/jobs/${jobId.value}/members/${m.userId}`, {
      method: 'PATCH',
      body: { dayRate: rates[m.userId] },
    })
    m.dayRate = rates[m.userId]!
  }
  catch (e: any) {
    alert(e?.data?.data?.errors?.[0] || e?.data?.statusMessage || t('portal.loadFailed'))
    rates[m.userId] = m.dayRate
  }
  finally {
    busy.value = ''
  }
}

const reinvite = async (m: JobMember) => {
  busy.value = m.userId
  try {
    await $fetch(`/api/portal/jobs/${jobId.value}/members/${m.userId}/reinvite`, { method: 'POST' })
    alert(t('portal.members.reinviteSent'))
  }
  catch (e: any) {
    alert(e?.data?.statusMessage || t('portal.loadFailed'))
  }
  finally {
    busy.value = ''
  }
}

const toggleMember = async (m: JobMember) => {
  const next = m.memberStatus === 'active' ? 'removed' : 'active'
  if (next === 'removed' && !confirm(t('portal.members.removeConfirm', { name: m.name || m.email }))) return
  busy.value = m.userId
  try {
    await $fetch(`/api/portal/jobs/${jobId.value}/members/${m.userId}`, { method: 'PATCH', body: { status: next } })
    m.memberStatus = next
  }
  catch (e: any) {
    alert(e?.data?.statusMessage || t('portal.loadFailed'))
  }
  finally {
    busy.value = ''
  }
}

useHead({ title: 'Job · Portal · Creative Filmmaking' })
</script>
