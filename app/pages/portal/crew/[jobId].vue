<template>
  <div>
    <p v-if="loadError" class="text-sm text-signal-500">{{ loadError }}</p>
    <p v-else-if="!loaded" class="text-sm text-bone-400">{{ $t('portal.loading') }}</p>

    <template v-else>
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="kicker">{{ $t('portal.crew.title') }}</p>
          <h1 class="mt-2 text-3xl font-semibold uppercase tracking-wide text-bone-100">
            {{ job?.name }}
            <span v-if="job?.status === 'closed'" class="ml-2 text-sm align-middle uppercase tracking-widest text-bone-400">{{ $t('portal.jobs.closed') }}</span>
          </h1>
        </div>
        <NuxtLink :to="localePath('/portal/crew')" class="text-xs uppercase tracking-widest text-bone-400 hover:text-gold-400 transition-colors">
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

      <!-- Per diem: job-wide daily allowance the crew can tick on their timesheet -->
      <div v-if="job?.status === 'active'" class="mt-8 border border-ink-800 bg-ink-900/50 p-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="kicker">{{ $t('portal.perDiem.title') }}</p>
          <p class="mt-2 text-sm text-bone-400">{{ $t('portal.perDiem.hint') }}</p>
        </div>
        <form class="flex items-end gap-3" @submit.prevent="savePerDiem">
          <div>
            <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.perDiem.amount') }}</label>
            <input v-model.number="perDiemInput" type="number" min="0" step="1" class="input-dark !w-40 text-right">
          </div>
          <button type="submit" class="btn-ghost disabled:opacity-40" :disabled="savingPerDiem || perDiemInput === (job?.perDiemRate ?? 0)">
            {{ savingPerDiem ? '…' : $t('portal.save') }}
          </button>
        </form>
      </div>

      <!-- Add member -->
      <form v-if="job?.status === 'active'" class="mt-8 border border-ink-800 bg-ink-900/50 p-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" @submit.prevent="add">
        <div>
          <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.members.email') }}</label>
          <input v-model="form.email" type="email" class="input-dark" required>
        </div>
        <div>
          <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.members.name') }}</label>
          <input v-model="form.name" type="text" class="input-dark">
        </div>
        <div>
          <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.crew.role') }}</label>
          <input v-model="form.role" type="text" class="input-dark">
        </div>
        <div>
          <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.crew.phone') }}</label>
          <input v-model="form.phone" type="tel" class="input-dark">
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
        <label v-if="form.departmentId" class="sm:col-span-2 lg:col-span-4 flex items-center gap-2 text-sm text-bone-400">
          <input v-model="form.isDeptAdmin" type="checkbox" class="accent-gold-500">
          {{ $t('portal.departments.makeAdmin') }}
        </label>
        <ul v-if="addErrors.length" class="sm:col-span-2 lg:col-span-4 text-sm text-signal-500 list-disc pl-5">
          <li v-for="err in addErrors" :key="err">{{ err }}</li>
        </ul>
      </form>

      <!-- Crew, grouped by department. Spreadsheet-style: one header, one line per member. -->
      <div class="mt-8 overflow-x-auto border border-ink-800">
        <table class="w-full table-fixed text-xs min-w-[64rem]">
          <colgroup>
            <col class="w-[15%]">
            <col class="w-[17%]">
            <col class="w-[11%]">
            <col class="w-[11%]">
            <col class="w-[8%]">
            <col class="w-[12%]">
            <col class="w-[10%]">
            <col class="w-[10%]">
            <col class="w-[6%]">
          </colgroup>
          <thead>
            <tr class="text-left uppercase tracking-widest text-bone-400 border-b border-ink-800 text-[10px]">
              <th class="px-2 py-2.5 font-normal">{{ $t('portal.crew.fullName') }}</th>
              <th class="px-2 py-2.5 font-normal">{{ $t('portal.members.email') }}</th>
              <th class="px-2 py-2.5 font-normal">{{ $t('portal.crew.role') }}</th>
              <th class="px-2 py-2.5 font-normal">{{ $t('portal.crew.phone') }}</th>
              <th class="px-2 py-2.5 font-normal text-right">{{ $t('portal.crew.rate') }}</th>
              <th class="px-2 py-2.5 font-normal">{{ $t('portal.crew.permission') }}</th>
              <th class="px-2 py-2.5 font-normal">{{ $t('portal.crew.contract') }}</th>
              <th class="px-2 py-2.5 font-normal">{{ $t('portal.crew.nda') }}</th>
              <th class="px-2 py-2.5" />
            </tr>
          </thead>
          <tbody v-for="group in groups" :key="group.id ?? 'none'">
            <tr class="bg-ink-900 border-b border-ink-800">
              <td colspan="9" class="px-2 py-1.5 text-[10px] uppercase tracking-widest text-gold-400">
                {{ group.name }} <span class="text-bone-400">({{ group.members.length }})</span>
              </td>
            </tr>
            <tr
              v-for="m in group.members"
              :key="m.userId"
              class="border-b border-ink-800 bg-ink-900/50 hover:bg-ink-900 transition-colors"
              :class="{ 'opacity-50': m.memberStatus === 'removed' }"
            >
              <td class="px-2 py-1.5">
                <span class="flex items-center gap-1.5 min-w-0">
                  <span
                    class="shrink-0 w-1.5 h-1.5 rounded-full"
                    :class="m.memberStatus === 'removed' ? 'bg-signal-500' : m.userStatus === 'active' ? 'bg-emerald-400' : 'bg-gold-400'"
                    :title="m.memberStatus === 'removed' ? $t('portal.members.removed') : m.userStatus === 'active' ? $t('portal.crew.active') : $t('portal.members.invited')"
                  />
                  <span class="font-semibold text-bone-100 truncate" :title="m.name || m.email">{{ m.name || m.email }}</span>
                </span>
              </td>
              <td class="px-2 py-1.5 text-bone-400 truncate" :title="m.email">{{ m.email }}</td>
              <td class="px-2 py-1.5">
                <input
                  v-model="edits[m.userId]!.role"
                  type="text"
                  class="input-dark !py-1 !px-2 !text-xs"
                  :disabled="m.memberStatus === 'removed'"
                  @blur="saveField(m, 'role')"
                  @keydown.enter="($event.target as HTMLInputElement).blur()"
                >
              </td>
              <td class="px-2 py-1.5">
                <input
                  v-model="edits[m.userId]!.phone"
                  type="tel"
                  class="input-dark !py-1 !px-2 !text-xs"
                  :disabled="m.memberStatus === 'removed'"
                  @blur="saveField(m, 'phone')"
                  @keydown.enter="($event.target as HTMLInputElement).blur()"
                >
              </td>
              <td class="px-2 py-1.5">
                <input
                  v-model.number="edits[m.userId]!.dayRate"
                  type="number"
                  min="1"
                  step="1"
                  class="input-dark !py-1 !px-2 !text-xs text-right"
                  :disabled="m.memberStatus === 'removed'"
                  :title="$t('portal.members.dayRate')"
                  @blur="saveRate(m)"
                  @keydown.enter="($event.target as HTMLInputElement).blur()"
                >
              </td>
              <td class="px-2 py-1.5">
                <select
                  class="input-dark !py-1 !px-2 !text-xs"
                  :value="m.isDeptAdmin ? 'head' : 'regular'"
                  :disabled="m.memberStatus === 'removed' || !m.departmentId || busy === m.userId"
                  :title="!m.departmentId ? $t('portal.crew.needsDepartment') : undefined"
                  @change="setPermission(m, ($event.target as HTMLSelectElement).value === 'head')"
                >
                  <option value="regular">{{ $t('portal.crew.regular') }}</option>
                  <option value="head">{{ $t('portal.crew.deptHead') }}</option>
                </select>
              </td>
              <td v-for="kind in (['contract', 'nda'] as DocKind[])" :key="kind" class="px-2 py-1.5">
                <span class="flex items-center gap-1.5">
                  <PortalDocStatusBadge :status="docFor(m.userId, kind)?.status" class="!px-1.5 !py-0.5 !text-[9px]" />
                  <a
                    v-if="docFor(m.userId, kind)?.hasFile"
                    :href="`/api/portal/jobs/${jobId}/members/${m.userId}/docs/${kind}/file`"
                    class="shrink-0 w-5 h-5 flex items-center justify-center border border-emerald-600/60 text-emerald-400 hover:bg-emerald-500 hover:text-ink-950 transition-colors"
                    :title="$t('portal.docs.download')"
                  >⬇</a>
                  <button
                    v-if="m.memberStatus === 'active' && canSend(kind) && docFor(m.userId, kind)?.status !== 'completed'"
                    type="button"
                    class="shrink-0 w-5 h-5 flex items-center justify-center border border-ink-700 text-bone-400 hover:border-gold-500 hover:text-gold-400 transition-colors disabled:opacity-50"
                    :disabled="sendBusy === `${m.userId}:${kind}`"
                    :title="docFor(m.userId, kind) ? $t('portal.docs.resend') : $t('portal.docs.send')"
                    @click="sendDoc(m, kind)"
                  >{{ sendBusy === `${m.userId}:${kind}` ? '…' : docFor(m.userId, kind) ? '↻' : '➤' }}</button>
                </span>
              </td>
              <td class="px-2 py-1.5">
                <span class="flex items-center justify-end gap-1.5">
                  <button
                    v-if="m.userStatus === 'invited' && m.memberStatus === 'active'"
                    type="button"
                    class="shrink-0 w-6 h-6 flex items-center justify-center border border-gold-600/60 text-gold-400 hover:bg-gold-500 hover:text-ink-950 transition-colors disabled:opacity-50"
                    :disabled="busy === m.userId"
                    :title="$t('portal.members.reinvite')"
                    @click="reinvite(m)"
                  >✉</button>
                  <button
                    type="button"
                    class="shrink-0 w-6 h-6 flex items-center justify-center border transition-colors disabled:opacity-50"
                    :class="m.memberStatus === 'active'
                      ? 'border-signal-500/60 text-signal-500 hover:bg-signal-500 hover:text-ink-950'
                      : 'border-ink-700 text-bone-400 hover:border-gold-500 hover:text-gold-400'"
                    :disabled="busy === m.userId"
                    :title="m.memberStatus === 'active' ? $t('portal.members.remove') : $t('portal.members.restore')"
                    @click="toggleMember(m)"
                  >{{ m.memberStatus === 'active' ? '✕' : '↩' }}</button>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="!members.length" class="p-8 text-center text-sm text-bone-400">{{ $t('portal.members.empty') }}</p>
      </div>

      <!-- Bulk paste from a spreadsheet -->
      <PortalBulkAddCrew v-if="job?.status === 'active'" :job-id="jobId" :departments="departments" class="mt-6" @added="load" />

      <!-- Contracts & NDAs -->
      <div class="mt-10 border border-ink-800 bg-ink-900/50 p-5">
        <p class="kicker">{{ $t('portal.docs.title') }}</p>
        <p class="mt-2 text-sm text-bone-400">{{ $t('portal.docs.hint') }}</p>

        <div class="mt-5 grid gap-5 lg:grid-cols-2">
          <div v-for="kind in (['contract', 'nda'] as DocKind[])" :key="kind" class="border border-ink-800 p-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <p class="font-semibold uppercase tracking-wider text-bone-100">{{ $t(`portal.docs.${kind}`) }}</p>
              <label class="btn-ghost !px-4 !py-2 !text-xs cursor-pointer">
                {{ uploadBusy === kind ? '…' : templates[kind] ? $t('portal.docs.replace') : $t('portal.docs.upload') }}
                <input type="file" accept="application/pdf,.pdf" class="hidden" :disabled="uploadBusy === kind" @change="uploadTemplate(kind, $event)">
              </label>
            </div>
            <template v-if="templates[kind]">
              <p class="mt-2 text-xs text-bone-400">
                {{ $t('portal.docs.uploadedName', { name: templates[kind]!.originalName }) }}
                · {{ templates[kind]!.fields.length }} ⛶
              </p>
              <p v-if="!hasSignature(kind)" class="mt-1 text-xs text-gold-400">{{ $t('portal.docs.noSignature') }}</p>
              <button type="button" class="btn-ghost !px-4 !py-2 !text-xs mt-3" @click="editorKind = editorKind === kind ? null : kind">
                {{ editorKind === kind ? $t('portal.docs.closeEditor') : $t('portal.docs.editFields') }}
              </button>
            </template>
            <p v-else class="mt-2 text-xs text-bone-400">{{ $t('portal.docs.noTemplate') }}</p>
          </div>
        </div>

        <ClientOnly>
          <PortalPdfFieldEditor
            v-if="editorKind"
            :key="editorKind"
            :job-id="jobId"
            :kind="editorKind"
            :initial-fields="templates[editorKind]?.fields ?? []"
            class="mt-6"
            @save="saveFields"
          />
        </ClientOnly>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Department, DocKind, DocTemplateMeta, Job, JobMember, MemberDoc, TemplateField } from '~/types'

definePageMeta({ layout: 'portal' })

const route = useRoute()
const localePath = useLocalePath()
const { t } = useI18n()
const { confirmDialog, alertDialog, promptDialog } = useAppDialog()
const jobId = computed(() => String(route.params.jobId))

const job = ref<Job | null>(null)
const members = ref<JobMember[]>([])
const departments = ref<Department[]>([])
const docs = ref<MemberDoc[]>([])
const templates = reactive<{ contract?: DocTemplateMeta, nda?: DocTemplateMeta }>({})
const edits = reactive<Record<string, { role: string, phone: string, dayRate: number }>>({})
const loaded = ref(false)
const loadError = ref('')
const adding = ref(false)
const addErrors = ref<string[]>([])
const busy = ref('')
const sendBusy = ref('')
const uploadBusy = ref<DocKind | ''>('')
const editorKind = ref<DocKind | null>(null)
const newDeptName = ref('')
const creatingDept = ref(false)
const perDiemInput = ref(0)
const savingPerDiem = ref(false)

const form = reactive({
  email: '', name: '', role: '', phone: '',
  dayRate: undefined as number | undefined, locale: 'is',
  departmentId: null as string | null, isDeptAdmin: false,
})

/** Members grouped by department (each department, then unassigned). */
const groups = computed(() => {
  const list: { id: string | null, name: string, members: JobMember[] }[] = departments.value
    .map(d => ({ id: d.id as string | null, name: d.name, members: members.value.filter(m => m.departmentId === d.id) }))
  list.push({
    id: null,
    name: t('portal.crew.unassigned'),
    members: members.value.filter(m => !m.departmentId),
  })
  return list.filter(g => g.members.length)
})

const docFor = (userId: string, kind: DocKind) =>
  docs.value.find(d => d.userId === userId && d.kind === kind)

const hasSignature = (kind: DocKind) =>
  Boolean(templates[kind]?.fields.some(f => f.type === 'signature'))

const canSend = (kind: DocKind) => Boolean(templates[kind]) && hasSignature(kind)

const load = async () => {
  loadError.value = ''
  try {
    const [res, tpl, docsRes] = await Promise.all([
      $fetch<{ job: Job, members: JobMember[], departments: Department[] }>(
        `/api/portal/jobs/${jobId.value}/members`, { query: { t: Date.now() } }),
      $fetch<{ contract?: DocTemplateMeta, nda?: DocTemplateMeta }>(
        `/api/portal/jobs/${jobId.value}/doc-templates`, { query: { t: Date.now() } }),
      $fetch<{ docs: MemberDoc[] }>(
        `/api/portal/jobs/${jobId.value}/docs`, { query: { t: Date.now() } }),
    ])
    job.value = res.job
    perDiemInput.value = res.job.perDiemRate ?? 0
    members.value = res.members
    departments.value = res.departments
    templates.contract = tpl.contract
    templates.nda = tpl.nda
    docs.value = docsRes.docs
    for (const m of res.members) {
      edits[m.userId] = { role: m.role ?? '', phone: m.phone ?? '', dayRate: m.dayRate }
    }
    loaded.value = true
  }
  catch (e: any) {
    loadError.value = e?.data?.statusMessage || t('portal.loadFailed')
  }
}

onMounted(load)

const savePerDiem = async () => {
  savingPerDiem.value = true
  try {
    await $fetch(`/api/portal/jobs/${jobId.value}`, { method: 'PATCH', body: { perDiemRate: Math.max(0, Math.round(perDiemInput.value || 0)) } })
    if (job.value) job.value = { ...job.value, perDiemRate: Math.max(0, Math.round(perDiemInput.value || 0)) }
  }
  catch (e: any) {
    await alertDialog(e?.data?.data?.errors?.[0] || e?.data?.statusMessage || t('portal.loadFailed'))
  }
  finally {
    savingPerDiem.value = false
  }
}

const add = async () => {
  addErrors.value = []
  adding.value = true
  try {
    await $fetch(`/api/portal/jobs/${jobId.value}/members`, { method: 'POST', body: { ...form } })
    Object.assign(form, { email: '', name: '', role: '', phone: '', dayRate: undefined, departmentId: null, isDeptAdmin: false })
    await load()
  }
  catch (e: any) {
    addErrors.value = e?.data?.data?.errors || [e?.data?.statusMessage || t('portal.loadFailed')]
  }
  finally {
    adding.value = false
  }
}

const saveField = async (m: JobMember, field: 'role' | 'phone') => {
  const value = edits[m.userId]![field].trim()
  if (value === (m[field] ?? '')) return
  busy.value = m.userId
  try {
    await $fetch(`/api/portal/jobs/${jobId.value}/members/${m.userId}`, { method: 'PATCH', body: { [field]: value } })
    m[field] = value || undefined
  }
  catch (e: any) {
    await alertDialog(e?.data?.data?.errors?.[0] || e?.data?.statusMessage || t('portal.loadFailed'))
    edits[m.userId]![field] = m[field] ?? ''
  }
  finally {
    busy.value = ''
  }
}

const saveRate = async (m: JobMember) => {
  const rate = edits[m.userId]!.dayRate
  if (rate === m.dayRate) return
  busy.value = m.userId
  try {
    await $fetch(`/api/portal/jobs/${jobId.value}/members/${m.userId}`, { method: 'PATCH', body: { dayRate: rate } })
    m.dayRate = rate
  }
  catch (e: any) {
    await alertDialog(e?.data?.data?.errors?.[0] || e?.data?.statusMessage || t('portal.loadFailed'))
    edits[m.userId]!.dayRate = m.dayRate
  }
  finally {
    busy.value = ''
  }
}

const setPermission = async (m: JobMember, isDeptAdmin: boolean) => {
  busy.value = m.userId
  try {
    await $fetch(`/api/portal/jobs/${jobId.value}/members/${m.userId}`, { method: 'PATCH', body: { isDeptAdmin } })
    m.isDeptAdmin = isDeptAdmin
  }
  catch (e: any) {
    await alertDialog(e?.data?.statusMessage || t('portal.loadFailed'))
    await load()
  }
  finally {
    busy.value = ''
  }
}

const reinvite = async (m: JobMember) => {
  busy.value = m.userId
  try {
    await $fetch(`/api/portal/jobs/${jobId.value}/members/${m.userId}/reinvite`, { method: 'POST' })
    await alertDialog(t('portal.crew.inviteSent'))
  }
  catch (e: any) {
    await alertDialog(e?.data?.statusMessage || t('portal.loadFailed'))
  }
  finally {
    busy.value = ''
  }
}

const toggleMember = async (m: JobMember) => {
  const next = m.memberStatus === 'active' ? 'removed' : 'active'
  if (next === 'removed' && !await confirmDialog(t('portal.members.removeConfirm', { name: m.name || m.email }))) return
  busy.value = m.userId
  try {
    await $fetch(`/api/portal/jobs/${jobId.value}/members/${m.userId}`, { method: 'PATCH', body: { status: next } })
    m.memberStatus = next
  }
  catch (e: any) {
    await alertDialog(e?.data?.statusMessage || t('portal.loadFailed'))
  }
  finally {
    busy.value = ''
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
    await alertDialog(e?.data?.data?.errors?.[0] || e?.data?.statusMessage || t('portal.loadFailed'))
  }
  finally {
    creatingDept.value = false
  }
}

const renameDepartment = async (d: Department) => {
  const name = await promptDialog(t('portal.departments.renamePrompt'), d.name)
  if (!name || name.trim() === d.name) return
  try {
    await $fetch(`/api/portal/jobs/${jobId.value}/departments/${d.id}`, { method: 'PATCH', body: { name } })
    await load()
  }
  catch (e: any) {
    await alertDialog(e?.data?.data?.errors?.[0] || e?.data?.statusMessage || t('portal.loadFailed'))
  }
}

const removeDepartment = async (d: Department) => {
  if (!await confirmDialog(t('portal.departments.deleteConfirm', { name: d.name }))) return
  try {
    await $fetch(`/api/portal/jobs/${jobId.value}/departments/${d.id}`, { method: 'DELETE' })
    await load()
  }
  catch (e: any) {
    await alertDialog(e?.data?.statusMessage || t('portal.loadFailed'))
  }
}

// ── Contracts / NDAs ──

const uploadTemplate = async (kind: DocKind, e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (templates[kind] && !await confirmDialog(t('portal.docs.replaceWarning'))) return
  uploadBusy.value = kind
  try {
    const body = new FormData()
    body.append('file', file)
    const meta = await $fetch<DocTemplateMeta>(`/api/portal/jobs/${jobId.value}/doc-templates/${kind}`, { method: 'POST', body })
    templates[kind] = meta
    editorKind.value = kind
  }
  catch (err: any) {
    await alertDialog(err?.data?.data?.errors?.[0] || err?.data?.statusMessage || t('portal.loadFailed'))
  }
  finally {
    uploadBusy.value = ''
  }
}

const saveFields = async ({ fields, pageCount }: { fields: TemplateField[], pageCount: number }) => {
  const kind = editorKind.value
  if (!kind) return
  try {
    const meta = await $fetch<DocTemplateMeta>(
      `/api/portal/jobs/${jobId.value}/doc-templates/${kind}/fields`,
      { method: 'PUT', body: { fields, pageCount } },
    )
    templates[kind] = meta
    await alertDialog(t('portal.docs.fieldsSaved'))
  }
  catch (err: any) {
    await alertDialog(err?.data?.data?.errors?.[0] || err?.data?.statusMessage || t('portal.loadFailed'))
  }
}

const sendDoc = async (m: JobMember, kind: DocKind) => {
  const kindLabel = t(`portal.docs.${kind}`)
  if (!await confirmDialog(t('portal.docs.sendConfirm', { kind: kindLabel, name: m.name || m.email }))) return
  sendBusy.value = `${m.userId}:${kind}`
  try {
    const doc = await $fetch<MemberDoc>(
      `/api/portal/jobs/${jobId.value}/members/${m.userId}/docs/${kind}`, { method: 'POST' })
    docs.value = [...docs.value.filter(d => !(d.userId === m.userId && d.kind === kind)), doc]
  }
  catch (err: any) {
    await alertDialog(err?.data?.data?.errors?.[0] || err?.data?.statusMessage || t('portal.loadFailed'))
  }
  finally {
    sendBusy.value = ''
  }
}

useHead({ title: 'Crew · Portal · Creative Filmmaking' })
</script>
