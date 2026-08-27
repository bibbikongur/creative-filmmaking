<template>
  <div class="max-w-5xl">
    <NuxtLink
      :to="queryJobId ? localePath(`/portal/jobs/${queryJobId}`) : localePath('/portal/jobs')"
      class="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-bone-500 hover:text-gold-400 transition-colors"
    >
      ← {{ queryJobId ? $t('portal.tools.backToJob') : $t('portal.nav.jobs') }}
    </NuxtLink>
    <h1 class="mt-3 text-3xl font-semibold uppercase tracking-wide text-bone-100">{{ $t('portal.tools.callSheet.title') }}</h1>
    <p class="mt-2 text-sm text-bone-400 max-w-2xl">{{ $t('portal.tools.callSheet.long') }}</p>

    <!-- Basics -->
    <div class="mt-8 border border-ink-800 bg-ink-900/50 p-5">
      <p class="text-xs uppercase tracking-widest text-bone-500">{{ $t('portal.tools.callSheet.basics') }}</p>
      <div class="mt-3 grid gap-3 sm:grid-cols-2">
        <label class="block">
          <span class="text-[10px] uppercase tracking-widest text-bone-500">{{ $t('portal.tools.callSheet.production') }}</span>
          <input v-model="sheet.production" type="text" class="input-dark mt-1" :placeholder="$t('portal.tools.callSheet.productionPlaceholder')" maxlength="120">
        </label>
        <div class="grid grid-cols-3 gap-3">
          <label class="block">
            <span class="text-[10px] uppercase tracking-widest text-bone-500">{{ $t('portal.tools.callSheet.dayLabel') }}</span>
            <input v-model="sheet.dayLabel" type="text" class="input-dark mt-1" :placeholder="$t('portal.tools.callSheet.dayLabelPlaceholder')" maxlength="60">
          </label>
          <label class="block">
            <span class="text-[10px] uppercase tracking-widest text-bone-500">{{ $t('portal.tools.callSheet.date') }}</span>
            <input v-model="sheet.date" type="date" class="input-dark mt-1">
          </label>
          <label class="block">
            <span class="text-[10px] uppercase tracking-widest text-bone-500">{{ $t('portal.tools.callSheet.crewCall') }}</span>
            <input v-model="sheet.crewCall" type="time" class="input-dark mt-1">
          </label>
        </div>
        <label class="block sm:col-span-2">
          <span class="text-[10px] uppercase tracking-widest text-bone-500">{{ $t('portal.tools.callSheet.note') }}</span>
          <textarea v-model="sheet.note" rows="2" class="input-dark mt-1" :placeholder="$t('portal.tools.callSheet.notePlaceholder')" maxlength="1000" />
        </label>
      </div>
      <div class="mt-3 grid gap-3 sm:grid-cols-3">
        <label class="block">
          <span class="text-[10px] uppercase tracking-widest text-bone-500">{{ $t('portal.tools.callSheet.weather') }}</span>
          <input v-model="sheet.weather" type="text" class="input-dark mt-1" :placeholder="$t('portal.tools.callSheet.weatherPlaceholder')" maxlength="120">
        </label>
        <label class="block">
          <span class="text-[10px] uppercase tracking-widest text-bone-500">{{ $t('portal.tools.callSheet.sunrise') }}</span>
          <input v-model="sheet.sunrise" type="time" class="input-dark mt-1">
        </label>
        <label class="block">
          <span class="text-[10px] uppercase tracking-widest text-bone-500">{{ $t('portal.tools.callSheet.sunset') }}</span>
          <input v-model="sheet.sunset" type="time" class="input-dark mt-1">
        </label>
      </div>
    </div>

    <!-- Locations -->
    <p class="mt-8 text-xs uppercase tracking-widest text-bone-500">{{ $t('portal.tools.callSheet.locations') }}</p>
    <div v-for="(l, i) in sheet.locations" :key="i" class="mt-3 border border-ink-800 bg-ink-900/50 p-4">
      <div class="flex items-center justify-between">
        <p class="text-[10px] uppercase tracking-widest text-gold-500 font-semibold">{{ $t('portal.tools.callSheet.location', { n: i + 1 }) }}</p>
        <button
          type="button"
          class="text-bone-600 hover:text-signal-500 transition-colors"
          :title="$t('portal.tools.remove')"
          @click="sheet.locations.splice(i, 1)"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
          </svg>
        </button>
      </div>
      <div class="mt-3 grid gap-3 sm:grid-cols-2">
        <label class="block">
          <span class="text-[10px] uppercase tracking-widest text-bone-500">{{ $t('portal.tools.callSheet.locationName') }}</span>
          <input v-model="l.name" type="text" class="input-dark mt-1" :placeholder="$t('portal.tools.callSheet.locationNamePlaceholder')" maxlength="160">
        </label>
        <label class="block">
          <span class="text-[10px] uppercase tracking-widest text-bone-500">{{ $t('portal.tools.callSheet.address') }}</span>
          <input v-model="l.address" type="text" class="input-dark mt-1" :placeholder="$t('portal.tools.callSheet.addressPlaceholder')" maxlength="200">
        </label>
        <label class="block">
          <span class="text-[10px] uppercase tracking-widest text-bone-500">{{ $t('portal.tools.callSheet.mapLinkField') }}</span>
          <input v-model="l.link" type="url" class="input-dark mt-1" :placeholder="$t('portal.tools.callSheet.mapLinkPlaceholder')" maxlength="500">
        </label>
        <label class="block">
          <span class="text-[10px] uppercase tracking-widest text-bone-500">{{ $t('portal.tools.callSheet.locationNotes') }}</span>
          <input v-model="l.notes" type="text" class="input-dark mt-1" :placeholder="$t('portal.tools.callSheet.locationNotesPlaceholder')" maxlength="500">
        </label>
      </div>
    </div>
    <button
      type="button"
      class="mt-3 border border-ink-700 px-4 py-2 text-xs uppercase tracking-widest text-bone-300 hover:border-gold-500 hover:text-gold-400 transition-colors"
      @click="sheet.locations.push(emptyLocation())"
    >+ {{ $t('portal.tools.callSheet.addLocation') }}</button>

    <!-- Schedule -->
    <p class="mt-8 text-xs uppercase tracking-widest text-bone-500">{{ $t('portal.tools.callSheet.schedule') }}</p>
    <div class="mt-3 border border-ink-800 bg-ink-900/50 p-4">
      <div v-for="(r, i) in sheet.schedule" :key="i" class="flex items-start gap-3" :class="i > 0 ? 'mt-3' : ''">
        <input v-model="r.time" type="time" class="input-dark !w-28 shrink-0">
        <div class="grid flex-1 gap-3 sm:grid-cols-2">
          <input v-model="r.label" type="text" class="input-dark" :placeholder="$t('portal.tools.callSheet.rowLabelPlaceholder')" maxlength="120">
          <input v-model="r.detail" type="text" class="input-dark" :placeholder="$t('portal.tools.callSheet.rowDetailPlaceholder')" maxlength="300">
        </div>
        <div class="flex items-center gap-1 pt-2.5">
          <button
            type="button"
            class="px-1 text-bone-600 hover:text-bone-200 transition-colors disabled:opacity-30"
            :disabled="i === 0"
            :title="$t('portal.tools.moveUp')"
            @click="moveRow(sheet.schedule, i, -1)"
          >↑</button>
          <button
            type="button"
            class="px-1 text-bone-600 hover:text-bone-200 transition-colors disabled:opacity-30"
            :disabled="i === sheet.schedule.length - 1"
            :title="$t('portal.tools.moveDown')"
            @click="moveRow(sheet.schedule, i, 1)"
          >↓</button>
          <button
            type="button"
            class="ml-1 text-bone-600 hover:text-signal-500 transition-colors"
            :title="$t('portal.tools.remove')"
            @click="sheet.schedule.splice(i, 1)"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
            </svg>
          </button>
        </div>
      </div>
      <button
        type="button"
        class="mt-3 border border-ink-700 px-4 py-2 text-xs uppercase tracking-widest text-bone-300 hover:border-gold-500 hover:text-gold-400 transition-colors"
        @click="sheet.schedule.push(emptyRow())"
      >+ {{ $t('portal.tools.callSheet.addRow') }}</button>
    </div>

    <!-- Crew -->
    <p class="mt-8 text-xs uppercase tracking-widest text-bone-500">{{ $t('portal.tools.callSheet.crew') }}</p>
    <div class="mt-3 border border-ink-800 bg-ink-900/50 p-4">
      <!-- Import from a portal job -->
      <div v-if="jobs.length" class="flex flex-wrap items-end gap-3 border-b border-ink-800 pb-4">
        <label class="block">
          <span class="text-[10px] uppercase tracking-widest text-bone-500">{{ $t('portal.tools.callSheet.importFromJob') }}</span>
          <select v-model="importJobId" class="input-dark mt-1 min-w-56">
            <option v-for="j in jobs" :key="j.jobId" :value="j.jobId">{{ j.jobName }} · {{ j.companyName }}</option>
          </select>
        </label>
        <button
          type="button"
          class="border border-ink-700 px-4 py-2.5 text-xs uppercase tracking-widest text-bone-300 hover:border-gold-500 hover:text-gold-400 transition-colors disabled:opacity-50"
          :disabled="importing || !importJobId"
          @click="importCrew"
        >{{ importing ? $t('portal.tools.callSheet.importing') : $t('portal.tools.callSheet.import') }}</button>
        <p v-if="importMsg" class="pb-2.5 text-xs text-bone-500">{{ importMsg }}</p>
      </div>

      <div v-for="(c, i) in sheet.crew" :key="i" class="mt-3 flex items-start gap-3">
        <input v-model="c.call" type="time" class="input-dark !w-28 shrink-0">
        <div class="grid flex-1 gap-3 sm:grid-cols-4">
          <input v-model="c.name" type="text" class="input-dark" :placeholder="$t('portal.tools.callSheet.colName')" maxlength="120">
          <input v-model="c.role" type="text" class="input-dark" :placeholder="$t('portal.tools.callSheet.colRole')" maxlength="120">
          <input v-model="c.dept" type="text" class="input-dark" :placeholder="$t('portal.tools.callSheet.colDept')" maxlength="120">
          <input v-model="c.phone" type="text" class="input-dark" :placeholder="$t('portal.tools.callSheet.colPhone')" maxlength="40">
        </div>
        <button
          type="button"
          class="mt-2.5 text-bone-600 hover:text-signal-500 transition-colors"
          :title="$t('portal.tools.remove')"
          @click="sheet.crew.splice(i, 1)"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
          </svg>
        </button>
      </div>
      <button
        type="button"
        class="mt-3 border border-ink-700 px-4 py-2 text-xs uppercase tracking-widest text-bone-300 hover:border-gold-500 hover:text-gold-400 transition-colors"
        @click="sheet.crew.push(emptyCrew())"
      >+ {{ $t('portal.tools.callSheet.addCrew') }}</button>
    </div>

    <!-- Contacts + safety -->
    <div class="mt-8 border border-ink-800 bg-ink-900/50 p-5">
      <p class="text-xs uppercase tracking-widest text-bone-500">{{ $t('portal.tools.callSheet.contacts') }}</p>
      <div v-for="(c, i) in sheet.contacts" :key="i" class="mt-3 flex items-start gap-3">
        <div class="grid flex-1 gap-3 sm:grid-cols-3">
          <input v-model="c.name" type="text" class="input-dark" :placeholder="$t('portal.tools.callSheet.contactName')" maxlength="120">
          <input v-model="c.role" type="text" class="input-dark" :placeholder="$t('portal.tools.callSheet.contactRole')" maxlength="120">
          <input v-model="c.phone" type="text" class="input-dark" :placeholder="$t('portal.tools.callSheet.contactPhone')" maxlength="40">
        </div>
        <button
          type="button"
          class="mt-3 text-bone-600 hover:text-signal-500 transition-colors"
          :title="$t('portal.tools.remove')"
          @click="sheet.contacts.splice(i, 1)"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
          </svg>
        </button>
      </div>
      <button
        type="button"
        class="mt-3 border border-ink-700 px-4 py-2 text-xs uppercase tracking-widest text-bone-300 hover:border-gold-500 hover:text-gold-400 transition-colors"
        @click="sheet.contacts.push(emptyContact())"
      >+ {{ $t('portal.tools.callSheet.addContact') }}</button>

      <label class="mt-5 block">
        <span class="text-[10px] uppercase tracking-widest text-bone-500">{{ $t('portal.tools.callSheet.safety') }}</span>
        <textarea v-model="sheet.safety" rows="2" class="input-dark mt-1" :placeholder="$t('portal.tools.callSheet.safetyPlaceholder')" maxlength="1000" />
      </label>
    </div>

    <p v-if="error" class="mt-4 text-sm text-signal-500">{{ error }}</p>

    <div class="mt-6 flex flex-wrap items-center gap-4">
      <button type="button" class="btn-gold disabled:opacity-50" :disabled="busy" @click="exportPdf">
        {{ busy ? $t('portal.tools.working') : $t('portal.tools.callSheet.export') }}
      </button>
      <button
        type="button"
        class="text-xs uppercase tracking-widest text-bone-500 hover:text-signal-500 transition-colors"
        @click="clearAll"
      >{{ $t('portal.tools.clearAll') }}</button>
    </div>
    <p class="mt-4 text-xs text-bone-600">{{ $t('portal.tools.callSheet.draftNote') }}</p>
  </div>
</template>

<script setup lang="ts">
import type { JobMember, PurchaseOrderJob } from '~/types'
import type { CallSheetContact, CallSheetCrew, CallSheetLocation, CallSheetRow } from '~/utils/callSheetPdf'

definePageMeta({ layout: 'portal' })
usePortalToolGuard('call-sheet')

const { t, locale } = useI18n()
const { confirmDialog } = useAppDialog()
const localePath = useLocalePath()
const route = useRoute()
// Opened from a job page (?job=) → the back link returns there.
const queryJobId = computed(() => (typeof route.query.job === 'string' ? route.query.job : ''))

interface Sheet {
  production: string
  dayLabel: string
  date: string
  crewCall: string
  note: string
  weather: string
  sunrise: string
  sunset: string
  locations: CallSheetLocation[]
  schedule: CallSheetRow[]
  crew: CallSheetCrew[]
  contacts: CallSheetContact[]
  safety: string
}

const emptyLocation = (): CallSheetLocation => ({ name: '', address: '', notes: '', link: '' })
const emptyRow = (): CallSheetRow => ({ time: '', label: '', detail: '' })
const emptyCrew = (): CallSheetCrew => ({ call: '', name: '', role: '', dept: '', phone: '' })
const emptyContact = (): CallSheetContact => ({ name: '', role: '', phone: '' })
const emptySheet = (): Sheet => ({
  production: '',
  dayLabel: '',
  date: '',
  crewCall: '07:00',
  note: '',
  weather: '',
  sunrise: '',
  sunset: '',
  locations: [emptyLocation()],
  schedule: [emptyRow()],
  crew: [],
  contacts: [],
  safety: '',
})

const sheet = reactive<Sheet>(emptySheet())
const busy = ref(false)
const error = ref('')

// ── Crew import from a portal job ────────────────────────────────────────────
// Jobs the user can admin come from the same endpoint the PO tool uses; the
// members call itself is job-admin only, so a dept admin gets a friendly error.
const jobs = ref<PurchaseOrderJob[]>([])
const importJobId = ref('')
const importing = ref(false)
const importMsg = ref('')

onMounted(async () => {
  try {
    jobs.value = (await $fetch<PurchaseOrderJob[]>('/api/portal/tools/purchase-orders/jobs')).filter(j => j.isJobAdmin)
    // Prefer the job the tool was opened from (?job=), else the first one.
    const preferred = jobs.value.find(j => j.jobId === queryJobId.value)
    importJobId.value = preferred?.jobId ?? jobs.value[0]?.jobId ?? ''
  }
  catch { /* not signed in to any job — the import UI just stays hidden */ }
})

const importCrew = async () => {
  if (!importJobId.value || importing.value) return
  importing.value = true
  importMsg.value = ''
  try {
    const res = await $fetch<{ members: JobMember[] }>(`/api/portal/jobs/${importJobId.value}/members`)
    const existing = new Set(sheet.crew.map(c => c.name.trim().toLowerCase()).filter(Boolean))
    const added = res.members
      .filter(m => m.memberStatus === 'active')
      .map(m => ({
        call: sheet.crewCall || '',
        name: m.name || m.email,
        role: m.role || '',
        dept: m.departmentName || '',
        phone: m.phone || '',
      }))
      .filter(c => !existing.has(c.name.trim().toLowerCase()))
    // Keep department groups together in the sheet.
    added.sort((a, b) => a.dept.localeCompare(b.dept, 'is') || a.name.localeCompare(b.name, 'is'))
    sheet.crew.push(...added)
    importMsg.value = t('portal.tools.callSheet.importedCount', { n: added.length })
  }
  catch {
    importMsg.value = t('portal.tools.callSheet.importFailed')
  }
  finally {
    importing.value = false
  }
}

// ── Draft persistence (browser only) ─────────────────────────────────────────
const DRAFT_KEY = 'cf-call-sheet'
let saveTimer: ReturnType<typeof setTimeout> | undefined
onMounted(() => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (raw) Object.assign(sheet, JSON.parse(raw))
  }
  catch { /* corrupt draft — start fresh */ }
})

watch(sheet, () => {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(sheet))
    }
    catch { /* storage full or blocked — draft just isn't persisted */ }
  }, 400)
}, { deep: true })

const moveRow = <T,>(arr: T[], i: number, dir: -1 | 1) => {
  const j = i + dir
  if (j < 0 || j >= arr.length) return
  const [x] = arr.splice(i, 1)
  arr.splice(j, 0, x!)
}

const clearAll = async () => {
  if (!await confirmDialog(t('portal.tools.callSheet.clearConfirm'))) return
  Object.assign(sheet, emptySheet())
  localStorage.removeItem(DRAFT_KEY)
}

const formatDate = (iso: string): string => {
  const s = new Date(`${iso}T00:00:00`).toLocaleDateString(
    locale.value === 'is' ? 'is-IS' : 'en-GB',
    { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
  )
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const slug = (s: string): string => s.toLowerCase()
  .replace(/ð/g, 'd').replace(/þ/g, 'th').replace(/æ/g, 'ae')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const exportPdf = async () => {
  error.value = ''
  if (!sheet.production.trim() && !sheet.schedule.some(r => r.label.trim())) {
    error.value = t('portal.tools.callSheet.needBasics')
    return
  }
  busy.value = true
  try {
    const bytes = await exportCallSheetPdf({
      production: sheet.production,
      dayLabel: sheet.dayLabel,
      crewCall: sheet.crewCall,
      note: sheet.note,
      weather: sheet.weather,
      sunrise: sheet.sunrise,
      sunset: sheet.sunset,
      locations: sheet.locations,
      schedule: sheet.schedule,
      crew: sheet.crew,
      contacts: sheet.contacts,
      safety: sheet.safety,
    }, {
      callSheet: t('portal.tools.callSheet.title'),
      crewCall: t('portal.tools.callSheet.crewCall'),
      sunrise: t('portal.tools.callSheet.sunrise'),
      sunset: t('portal.tools.callSheet.sunset'),
      locations: t('portal.tools.callSheet.locations'),
      schedule: t('portal.tools.callSheet.schedule'),
      crew: t('portal.tools.callSheet.crew'),
      colCall: t('portal.tools.callSheet.colCall'),
      colName: t('portal.tools.callSheet.colName'),
      colRole: t('portal.tools.callSheet.colRole'),
      colDept: t('portal.tools.callSheet.colDept'),
      colPhone: t('portal.tools.callSheet.colPhone'),
      contacts: t('portal.tools.callSheet.contacts'),
      safety: t('portal.tools.callSheet.safety'),
      mapLink: t('portal.tools.callSheet.mapLink'),
      continued: t('portal.tools.callSheet.continued'),
      dateText: sheet.date ? formatDate(sheet.date) : '',
    })
    const name = `${slug(sheet.production) || 'call-sheet'}${sheet.date ? `-${sheet.date}` : ''}.pdf`
    downloadBlob(bytes, name, 'application/pdf')
  }
  catch {
    error.value = t('portal.tools.callSheet.failed')
  }
  finally {
    busy.value = false
  }
}

useHead({ title: 'Call sheet · Hjálpartól · Portal' })
</script>
