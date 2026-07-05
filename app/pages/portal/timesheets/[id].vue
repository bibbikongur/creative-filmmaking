<template>
  <div>
    <p v-if="loadError" class="text-sm text-signal-500">{{ loadError }}</p>
    <p v-else-if="!loaded" class="text-sm text-bone-400">{{ $t('portal.loading') }}</p>

    <template v-else>
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="kicker">{{ $t('portal.nav.review') }}</p>
          <h1 class="mt-2 text-3xl font-semibold uppercase tracking-wide text-bone-100">
            {{ detail!.user?.name || detail!.user?.email }}
          </h1>
          <p class="mt-1 text-sm text-bone-400">
            {{ detail!.job?.name }} · {{ formatWeekRange(detail!.week.weekStart, locale) }}
          </p>
        </div>
        <div class="flex items-center gap-4">
          <PortalWeekStatusBadge :status="detail!.week.status" />
          <NuxtLink :to="localePath('/portal/timesheets')" class="text-xs uppercase tracking-widest text-bone-400 hover:text-gold-400 transition-colors">
            ← {{ $t('portal.back') }}
          </NuxtLink>
        </div>
      </div>

      <!-- Entries + per-day breakdown -->
      <div class="mt-8 overflow-x-auto border border-ink-800">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-xs uppercase tracking-widest text-bone-400 border-b border-ink-800">
              <th class="p-3 font-normal">{{ $t('portal.review.day') }}</th>
              <th class="p-3 font-normal">{{ $t('portal.review.times') }}</th>
              <th class="p-3 font-normal text-right">{{ $t('portal.pay.hours') }}</th>
              <th class="p-3 font-normal text-right">{{ $t('portal.pay.otHours') }}</th>
              <th class="p-3 font-normal text-right">{{ $t('portal.pay.restViolation') }}</th>
              <th class="p-3 font-normal text-right">{{ $t('portal.review.amount') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-ink-800">
            <tr v-for="day in days" :key="day.date" class="bg-ink-900/50">
              <td class="p-3 whitespace-nowrap align-top">
                <span class="font-semibold text-bone-100">{{ dayName(day.date) }}</span>
                <span class="ml-1 text-xs text-bone-400">{{ formatShortDate(day.date, locale) }}</span>
                <span v-if="day.breakdown?.doublePay" class="ml-2 text-[11px] uppercase tracking-widest text-gold-400">
                  {{ $t('portal.pay.seventhDay') }}
                </span>
              </td>
              <td class="p-3 align-top">
                <template v-if="!editing">
                  <p v-for="e in entriesFor(day.date)" :key="e.id" class="whitespace-nowrap text-bone-100">
                    {{ minutesToTime(e.startMin) }}–{{ minutesToTime(e.endMin) }}
                    <span v-if="e.endMin > 1440" class="text-[11px] uppercase tracking-widest text-gold-400">+1</span>
                    <span v-if="e.note" class="ml-2 text-xs text-bone-400">{{ e.note }}</span>
                  </p>
                  <p v-if="!entriesFor(day.date).length" class="text-bone-400/60">—</p>
                </template>
                <template v-else>
                  <div v-for="(row, ri) in rowsFor(day.date)" :key="ri" class="flex items-center gap-2 mb-2">
                    <input v-model="row.start" type="time" class="input-dark !w-24 !py-1">
                    <span class="text-bone-400">–</span>
                    <input v-model="row.end" type="time" class="input-dark !w-24 !py-1">
                    <button type="button" class="text-signal-500/80 hover:text-signal-500 text-xs" @click="removeRow(row)">✕</button>
                  </div>
                  <button type="button" class="text-xs uppercase tracking-widest text-bone-400 hover:text-gold-400 transition-colors" @click="addRow(day.date)">
                    + {{ $t('portal.timesheet.addShift') }}
                  </button>
                </template>
              </td>
              <td class="p-3 text-right align-top text-bone-100">{{ day.breakdown ? formatHoursNum(day.breakdown.hours) : '' }}</td>
              <td class="p-3 text-right align-top" :class="day.breakdown?.otHours ? 'text-gold-400' : 'text-bone-400'">
                {{ day.breakdown ? formatHoursNum(day.breakdown.otHours) : '' }}
              </td>
              <td class="p-3 text-right align-top" :class="day.breakdown?.restViolationHours ? 'text-signal-500' : 'text-bone-400'">
                {{ day.breakdown ? formatHoursNum(day.breakdown.restViolationHours) : '' }}
              </td>
              <td class="p-3 text-right align-top font-semibold text-bone-100">
                {{ day.breakdown ? formatIsk(day.breakdown.total, locale) : '' }}
              </td>
            </tr>
          </tbody>
          <tfoot v-if="payroll">
            <tr class="border-t border-ink-700 bg-ink-900 font-semibold text-bone-100">
              <td class="p-3 uppercase text-xs tracking-widest text-bone-400">{{ $t('portal.review.totals') }}</td>
              <td class="p-3 text-xs text-bone-400">
                {{ payroll.totals.daysWorked }} {{ $t('portal.pay.daysShort') }}
                <span v-if="payroll.totals.doubleDays"> · {{ payroll.totals.doubleDays }}× {{ $t('portal.pay.seventhDay') }}</span>
              </td>
              <td class="p-3 text-right">{{ formatHoursNum(payroll.totals.hours) }}</td>
              <td class="p-3 text-right">{{ formatHoursNum(payroll.totals.otHours) }}</td>
              <td class="p-3 text-right">{{ formatHoursNum(payroll.totals.restViolationHours) }}</td>
              <td class="p-3 text-right text-gold-400">{{ formatIsk(payroll.totals.amount, locale) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p v-if="detail!.dayRate == null" class="mt-3 text-sm text-signal-500">{{ $t('portal.timesheet.noRate') }}</p>
      <p v-else class="mt-3 text-xs text-bone-400">
        {{ $t('portal.members.dayRate') }}: {{ formatIsk(detail!.dayRate!, locale) }}
        · {{ $t('portal.pay.otRate') }}: {{ payroll ? formatIsk(payroll.hourlyOtRate, locale) : '' }}/{{ $t('portal.timesheet.hoursShort') }}
      </p>

      <!-- Actions -->
      <div class="mt-6 flex flex-wrap items-center gap-3">
        <template v-if="!editing && ['submitted', 'altered'].includes(detail!.week.status)">
          <button v-if="detail!.week.status === 'submitted'" type="button" class="btn-gold disabled:opacity-60" :disabled="acting" @click="approve">
            {{ acting ? '…' : $t('portal.review.approve') }}
          </button>
          <button type="button" class="btn-ghost" @click="startEditing">{{ $t('portal.review.editTimes') }}</button>
          <button type="button" class="btn-ghost" :disabled="acting" @click="reopen">{{ $t('portal.review.reopen') }}</button>
        </template>
        <template v-else-if="editing">
          <input
            v-model="alterNote"
            type="text"
            class="input-dark !w-72"
            :placeholder="$t('portal.review.notePlaceholder')"
          >
          <button type="button" class="btn-gold disabled:opacity-60" :disabled="acting" @click="sendAlteration">
            {{ acting ? '…' : $t('portal.review.sendAlteration') }}
          </button>
          <button type="button" class="btn-ghost" @click="cancelEditing">{{ $t('portal.cancel') }}</button>
        </template>
        <p v-if="detail!.week.status === 'altered' && !editing" class="text-sm text-bone-400">
          {{ $t('portal.review.awaitingConfirmation') }}
        </p>
        <ul v-if="actionErrors.length" class="w-full text-sm text-signal-500 list-disc pl-5">
          <li v-for="err in actionErrors" :key="err">{{ err }}</li>
        </ul>
      </div>

      <!-- History -->
      <div v-if="detail!.events.length" class="mt-10">
        <p class="kicker">{{ $t('portal.review.history') }}</p>
        <div class="mt-3 border border-ink-800 divide-y divide-ink-800 text-sm">
          <div v-for="ev in detail!.events" :key="ev.id" class="p-3 bg-ink-900/50">
            <p class="text-bone-100">
              <span class="text-bone-400">{{ formatDateTime(ev.createdAt) }}</span>
              · {{ ev.actorName || '—' }} · {{ $t(`portal.events.${ev.type}`) }}
            </p>
            <p v-if="ev.detail?.note" class="mt-1 text-bone-400">„{{ ev.detail.note }}"</p>
            <ul v-if="ev.detail?.changes?.length" class="mt-1 space-y-0.5 text-xs text-bone-400">
              <li v-for="(c, i) in ev.detail.changes" :key="i">
                {{ formatShortDate(c.date, locale) }}:
                <span class="line-through">{{ c.before ? `${minutesToTime(c.before.startMin)}–${minutesToTime(c.before.endMin)}` : '—' }}</span>
                → {{ c.after ? `${minutesToTime(c.after.startMin)}–${minutesToTime(c.after.endMin)}` : '—' }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { DayBreakdown, TimeEntry, TimesheetWeek, WeekEvent, WeekPayroll } from '~/types'

definePageMeta({ layout: 'portal' })

const route = useRoute()
const localePath = useLocalePath()
const { t, locale } = useI18n()

interface Detail {
  week: TimesheetWeek
  user: { id: string, email: string, name?: string } | null
  job: { id: string, name: string } | null
  dayRate: number | null
  entries: TimeEntry[]
  payroll: WeekPayroll | null
  events: WeekEvent[]
}

interface ShiftRow { date: string, start: string, end: string }

const detail = ref<Detail | null>(null)
const loaded = ref(false)
const loadError = ref('')
const editing = ref(false)
const rows = ref<ShiftRow[]>([])
const alterNote = ref('')
const acting = ref(false)
const actionErrors = ref<string[]>([])

const payroll = computed(() => detail.value?.payroll ?? null)

const days = computed(() => {
  if (!detail.value) return []
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDaysIso(detail.value!.week.weekStart, i)
    return {
      date,
      breakdown: payroll.value?.days.find(d => d.date === date) as DayBreakdown | undefined,
    }
  })
})

const entriesFor = (date: string) => detail.value?.entries.filter(e => e.date === date) ?? []
const rowsFor = (date: string) => rows.value.filter(r => r.date === date)

const load = async () => {
  loadError.value = ''
  try {
    detail.value = await $fetch<Detail>(`/api/portal/timesheets/${route.params.id}`, { query: { t: Date.now() } })
    loaded.value = true
  }
  catch (e: any) {
    loadError.value = e?.data?.statusMessage || t('portal.loadFailed')
  }
}

onMounted(load)

const startEditing = () => {
  rows.value = (detail.value?.entries ?? []).map(e => ({
    date: e.date,
    start: minutesToTime(e.startMin),
    end: minutesToTime(e.endMin),
  }))
  alterNote.value = ''
  editing.value = true
}

const cancelEditing = () => {
  editing.value = false
  actionErrors.value = []
}

const addRow = (date: string) => rows.value.push({ date, start: '', end: '' })
const removeRow = (row: ShiftRow) => {
  rows.value = rows.value.filter(r => r !== row)
}

const toEntries = () => rows.value
  .map((r) => {
    const s = timeToMinutes(r.start)
    const e = timeToMinutes(r.end)
    if (s === null || e === null) return null
    return { date: r.date, startMin: s, endMin: e <= s ? e + 1440 : e }
  })
  .filter(Boolean)

const approve = async () => {
  if (!confirm(t('portal.review.approveConfirm'))) return
  await act(`/api/portal/timesheets/${route.params.id}/approve`, {})
}

const reopen = async () => {
  if (!confirm(t('portal.review.reopenConfirm'))) return
  await act(`/api/portal/timesheets/${route.params.id}/reopen`, {})
}

const sendAlteration = async () => {
  await act(`/api/portal/timesheets/${route.params.id}/alter`, {
    entries: toEntries(),
    note: alterNote.value,
  })
  if (!actionErrors.value.length) editing.value = false
}

const act = async (url: string, body: Record<string, unknown>) => {
  actionErrors.value = []
  acting.value = true
  try {
    await $fetch(url, { method: 'POST', body })
    await load()
  }
  catch (e: any) {
    actionErrors.value = e?.data?.data?.errors || [e?.data?.statusMessage || t('portal.loadFailed')]
  }
  finally {
    acting.value = false
  }
}

const dayName = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale.value === 'is' ? 'is-IS' : 'en-GB', { weekday: 'short', timeZone: 'UTC' })

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString(locale.value === 'is' ? 'is-IS' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' })

useHead({ title: 'Timesheet · Portal · Creative Filmmaking' })
</script>
