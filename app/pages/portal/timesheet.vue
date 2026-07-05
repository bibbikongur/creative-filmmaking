<template>
  <div>
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="kicker">{{ $t('portal.timesheet.kicker') }}</p>
        <h1 class="mt-2 text-3xl font-semibold uppercase tracking-wide text-bone-100">{{ $t('portal.timesheet.title') }}</h1>
      </div>
      <!-- Job picker -->
      <div v-if="activeJobs.length" class="min-w-64">
        <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.timesheet.job') }}</label>
        <select v-model="jobId" class="input-dark">
          <option v-for="j in activeJobs" :key="j.jobId" :value="j.jobId">
            {{ j.jobName }} · {{ j.companyName }}
          </option>
        </select>
      </div>
    </div>

    <p v-if="!activeJobs.length" class="mt-10 text-sm text-bone-400">{{ $t('portal.timesheet.noJobs') }}</p>

    <template v-else>
      <!-- Week navigator -->
      <div class="mt-8 flex items-center justify-between gap-4 border border-ink-800 bg-ink-900/50 px-4 py-3">
        <button type="button" class="btn-ghost !px-3" @click="moveWeek(-7)">‹</button>
        <div class="text-center">
          <p class="font-semibold text-bone-100">{{ formatWeekRange(weekStart, locale) }}</p>
          <PortalWeekStatusBadge v-if="week" :status="week.status" class="mt-1.5" />
        </div>
        <button type="button" class="btn-ghost !px-3" @click="moveWeek(7)">›</button>
      </div>

      <p v-if="loadError" class="mt-6 text-sm text-signal-500">{{ loadError }}</p>
      <p v-else-if="!loaded" class="mt-6 text-sm text-bone-400">{{ $t('portal.loading') }}</p>

      <template v-else>
        <!-- Status banner -->
        <div v-if="week?.status === 'submitted'" class="mt-6 border border-gold-600/40 bg-gold-600/10 p-4 text-sm text-bone-100">
          {{ $t('portal.timesheet.submittedBanner') }}
        </div>
        <div v-else-if="week?.status === 'approved'" class="mt-6 border border-emerald-600/40 bg-emerald-600/10 p-4 text-sm text-bone-100">
          {{ $t('portal.timesheet.approvedBanner') }}
        </div>
        <div v-else-if="week?.status === 'altered'" class="mt-6 border border-signal-500/40 bg-signal-500/10 p-4 text-sm">
          <p class="font-semibold text-signal-500">{{ $t('portal.timesheet.alteredBanner') }}</p>
          <p v-if="alterationNote" class="mt-2 text-bone-100">„{{ alterationNote }}"</p>
          <ul v-if="alterationChanges.length" class="mt-3 space-y-1 text-bone-100">
            <li v-for="(c, i) in alterationChanges" :key="i">
              <span class="text-bone-400">{{ formatShortDate(c.date, locale) }}:</span>
              <span class="line-through text-bone-400 mx-1">{{ c.before ? `${minutesToTime(c.before.startMin)}–${minutesToTime(c.before.endMin)}` : '—' }}</span>
              →
              <span class="text-gold-400 ml-1">{{ c.after ? `${minutesToTime(c.after.startMin)}–${minutesToTime(c.after.endMin)}` : '—' }}</span>
            </li>
          </ul>
          <button type="button" class="btn-gold mt-4 disabled:opacity-60" :disabled="acting" @click="confirmAlteration">
            {{ acting ? '…' : $t('portal.timesheet.confirmChanges') }}
          </button>
        </div>

        <div class="mt-6 grid gap-6 lg:grid-cols-[1fr_18rem]">
          <!-- Day rows -->
          <div class="border border-ink-800 divide-y divide-ink-800">
            <div v-for="day in days" :key="day.date" class="p-4 bg-ink-900/50">
              <div class="flex items-center justify-between gap-4">
                <p class="text-sm font-semibold text-bone-100">
                  {{ dayName(day.date) }}
                  <span class="ml-1 text-xs font-normal text-bone-400">{{ formatShortDate(day.date, locale) }}</span>
                </p>
                <button
                  v-if="editable"
                  type="button"
                  class="text-xs uppercase tracking-widest text-bone-400 hover:text-gold-400 transition-colors"
                  @click="addShift(day.date)"
                >
                  + {{ $t('portal.timesheet.addShift') }}
                </button>
              </div>

              <div v-for="(row, ri) in rowsFor(day.date)" :key="ri" class="mt-3 flex flex-wrap items-center gap-3">
                <label class="text-xs uppercase tracking-widest text-bone-400">{{ $t('portal.timesheet.in') }}</label>
                <input v-model="row.start" type="time" class="input-dark !w-28" :disabled="!editable">
                <label class="text-xs uppercase tracking-widest text-bone-400">{{ $t('portal.timesheet.out') }}</label>
                <input v-model="row.end" type="time" class="input-dark !w-28" :disabled="!editable">
                <span v-if="endsNextDay(row)" class="text-[11px] uppercase tracking-widest text-gold-400">
                  {{ $t('portal.timesheet.endsNextDay') }}
                </span>
                <span v-if="rowHours(row) !== null" class="text-xs text-bone-400 ml-auto">
                  {{ formatHoursNum(rowHours(row)!) }} {{ $t('portal.timesheet.hoursShort') }}
                </span>
                <button
                  v-if="editable"
                  type="button"
                  class="text-xs uppercase tracking-widest text-signal-500/80 hover:text-signal-500 transition-colors"
                  @click="removeShift(row)"
                >
                  ✕
                </button>
              </div>
              <p v-if="!rowsFor(day.date).length" class="mt-2 text-xs text-bone-400/60">{{ $t('portal.timesheet.dayOff') }}</p>
            </div>
          </div>

          <!-- Summary -->
          <div class="lg:sticky lg:top-6 self-start border border-ink-800 bg-ink-900/50 p-5 space-y-4">
            <p class="kicker">{{ $t('portal.timesheet.summary') }}</p>
            <template v-if="payroll">
              <div v-for="stat in summaryStats" :key="stat.label" class="flex items-baseline justify-between gap-3">
                <span class="text-xs uppercase tracking-widest text-bone-400">{{ stat.label }}</span>
                <span class="font-semibold text-bone-100">{{ stat.value }}</span>
              </div>
              <div class="border-t border-ink-800 pt-4 flex items-baseline justify-between gap-3">
                <span class="text-xs uppercase tracking-widest text-bone-400">{{ $t('portal.pay.estimated') }}</span>
                <span class="text-lg font-semibold text-gold-400">{{ formatIsk(payroll.totals.amount, locale) }}</span>
              </div>
            </template>
            <p v-else class="text-xs text-bone-400">{{ $t('portal.timesheet.noRate') }}</p>

            <ul v-if="saveErrors.length" class="text-sm text-signal-500 list-disc pl-5">
              <li v-for="err in saveErrors" :key="err">{{ err }}</li>
            </ul>

            <template v-if="editable">
              <p class="text-xs text-bone-400" :class="{ 'text-gold-400': dirty }">
                {{ dirty ? $t('portal.timesheet.unsaved') : $t('portal.timesheet.saved') }}
              </p>
              <button type="button" class="btn-gold w-full disabled:opacity-60" :disabled="acting || !hasRows" @click="submitWeekNow">
                {{ acting ? '…' : $t('portal.timesheet.submitWeek') }}
              </button>
              <p class="text-[11px] leading-relaxed text-bone-400">{{ $t('portal.timesheet.submitHint') }}</p>
            </template>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { TimeEntry, TimesheetWeek, WeekEvent, WeekPayroll } from '~/types'

definePageMeta({ layout: 'portal' })

const { memberships } = usePortalAuth()
const { t, locale } = useI18n()

interface ShiftRow { date: string, start: string, end: string, note?: string }

const activeJobs = computed(() => (memberships.value?.jobs ?? []).filter(j => j.status === 'active'))
const jobId = ref('')
watch(activeJobs, (jobs) => {
  if (!jobId.value && jobs.length) jobId.value = jobs[0]!.jobId
  else if (jobId.value && !jobs.some(j => j.jobId === jobId.value)) jobId.value = jobs[0]?.jobId ?? ''
}, { immediate: true })

const weekStart = ref(mondayOf(new Date()))
const week = ref<TimesheetWeek | null>(null)
const payroll = ref<WeekPayroll | null>(null)
const events = ref<WeekEvent[]>([])
const rows = ref<ShiftRow[]>([])
const loaded = ref(false)
const loadError = ref('')
const dirty = ref(false)
const saveErrors = ref<string[]>([])
const acting = ref(false)

const editable = computed(() => week.value?.status === 'draft')
const hasRows = computed(() => rows.value.some(r => timeToMinutes(r.start) !== null && timeToMinutes(r.end) !== null))

const days = computed(() => Array.from({ length: 7 }, (_, i) => ({ date: addDaysIso(weekStart.value, i) })))

const entryToRow = (e: TimeEntry): ShiftRow => ({
  date: e.date,
  start: minutesToTime(e.startMin),
  end: minutesToTime(e.endMin),
  note: e.note,
})

const load = async () => {
  if (!jobId.value) return
  loadError.value = ''
  loaded.value = false
  try {
    const res = await $fetch<{ week: TimesheetWeek, entries: TimeEntry[], payroll: WeekPayroll | null, events: WeekEvent[] }>(
      `/api/portal/my/jobs/${jobId.value}/weeks/${weekStart.value}`, { query: { t: Date.now() } })
    week.value = res.week
    payroll.value = res.payroll
    events.value = res.events
    rows.value = res.entries.map(entryToRow)
    dirty.value = false
    saveErrors.value = []
    loaded.value = true
  }
  catch (e: any) {
    loadError.value = e?.data?.statusMessage || t('portal.loadFailed')
  }
}

watch([jobId, weekStart], load, { immediate: true })

const moveWeek = (days: number) => {
  weekStart.value = addDaysIso(weekStart.value, days)
}

const rowsFor = (date: string) => rows.value.filter(r => r.date === date)

const addShift = (date: string) => {
  rows.value.push({ date, start: '', end: '' })
}

const removeShift = (row: ShiftRow) => {
  rows.value = rows.value.filter(r => r !== row)
  dirty.value = true
  scheduleSave()
}

const endsNextDay = (row: ShiftRow) => {
  const s = timeToMinutes(row.start)
  const e = timeToMinutes(row.end)
  return s !== null && e !== null && e <= s
}

const rowHours = (row: ShiftRow): number | null => {
  const s = timeToMinutes(row.start)
  const e = timeToMinutes(row.end)
  if (s === null || e === null) return null
  return ((e <= s ? e + 1440 : e) - s) / 60
}

const toEntries = () => rows.value
  .map((r) => {
    const s = timeToMinutes(r.start)
    const e = timeToMinutes(r.end)
    if (s === null || e === null) return null
    return { date: r.date, startMin: s, endMin: e <= s ? e + 1440 : e, note: r.note }
  })
  .filter(Boolean)

// Debounced auto-save while editing a draft.
let saveTimer: ReturnType<typeof setTimeout> | null = null
const scheduleSave = () => {
  if (!editable.value) return
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(save, 900)
}

watch(rows, () => {
  if (!loaded.value || !editable.value) return
  dirty.value = true
  scheduleSave()
}, { deep: true })

const save = async () => {
  if (!editable.value) return
  saveErrors.value = []
  try {
    const res = await $fetch<{ week: TimesheetWeek, entries: TimeEntry[], payroll: WeekPayroll | null }>(
      `/api/portal/my/jobs/${jobId.value}/weeks/${weekStart.value}/entries`,
      { method: 'PUT', body: { entries: toEntries() } })
    payroll.value = res.payroll
    week.value = res.week
    dirty.value = false
  }
  catch (e: any) {
    saveErrors.value = e?.data?.data?.errors || [e?.data?.statusMessage || t('portal.loadFailed')]
  }
}

const submitWeekNow = async () => {
  if (!confirm(t('portal.timesheet.submitConfirm'))) return
  acting.value = true
  try {
    if (saveTimer) clearTimeout(saveTimer)
    await save()
    if (saveErrors.value.length) return
    await $fetch(`/api/portal/my/jobs/${jobId.value}/weeks/${weekStart.value}/submit`, { method: 'POST' })
    await load()
  }
  catch (e: any) {
    saveErrors.value = [e?.data?.statusMessage || t('portal.loadFailed')]
  }
  finally {
    acting.value = false
  }
}

const confirmAlteration = async () => {
  acting.value = true
  try {
    await $fetch(`/api/portal/my/jobs/${jobId.value}/weeks/${weekStart.value}/confirm`, { method: 'POST' })
    await load()
  }
  catch (e: any) {
    saveErrors.value = [e?.data?.statusMessage || t('portal.loadFailed')]
  }
  finally {
    acting.value = false
  }
}

// Latest alteration event → banner diff
const latestAlteration = computed(() => events.value.find(e => e.type === 'altered'))
const alterationNote = computed(() => latestAlteration.value?.detail?.note ?? '')
const alterationChanges = computed(() => latestAlteration.value?.detail?.changes ?? [])

const dayName = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale.value === 'is' ? 'is-IS' : 'en-GB', { weekday: 'long', timeZone: 'UTC' })

const summaryStats = computed(() => {
  if (!payroll.value) return []
  const p = payroll.value
  return [
    { label: t('portal.pay.daysWorked'), value: String(p.totals.daysWorked) },
    { label: t('portal.pay.hours'), value: formatHoursNum(p.totals.hours) },
    { label: t('portal.pay.otHours'), value: formatHoursNum(p.totals.otHours) },
    { label: t('portal.pay.restViolation'), value: formatHoursNum(p.totals.restViolationHours) },
    { label: t('portal.pay.doubleDays'), value: String(p.totals.doubleDays) },
  ]
})

useHead({ title: 'Timesheet · Portal · Creative Filmmaking' })
</script>
