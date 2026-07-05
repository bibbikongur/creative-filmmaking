<template>
  <div>
    <div>
      <p class="kicker">{{ $t('portal.nav.history') }}</p>
      <h1 class="mt-2 text-3xl font-semibold uppercase tracking-wide text-bone-100">{{ $t('portal.history.title') }}</h1>
    </div>

    <div v-if="jobs.length > 1" class="mt-6 max-w-xs">
      <select v-model="filterJob" class="input-dark">
        <option value="">{{ $t('portal.history.allJobs') }}</option>
        <option v-for="j in jobs" :key="j.jobId" :value="j.jobId">{{ j.jobName }} · {{ j.companyName }}</option>
      </select>
    </div>

    <p v-if="loadError" class="mt-8 text-sm text-signal-500">{{ loadError }}</p>
    <p v-else-if="!loaded" class="mt-8 text-sm text-bone-400">{{ $t('portal.loading') }}</p>

    <div v-else class="mt-8 border border-ink-800 divide-y divide-ink-800">
      <div
        v-for="w in filtered"
        :key="`${w.jobId}-${w.weekStart}`"
        class="flex flex-wrap items-center gap-4 p-4 bg-ink-900/50 hover:bg-ink-900 transition-colors"
      >
        <div class="min-w-0 flex-1">
          <p class="font-semibold text-bone-100">
            {{ formatWeekRange(w.weekStart, locale) }}
            <span class="ml-2 text-xs font-normal text-bone-400">{{ w.jobName }}</span>
          </p>
          <p v-if="w.payroll" class="mt-0.5 text-xs text-bone-400">
            {{ w.payroll.totals.daysWorked }} {{ $t('portal.pay.daysShort') }}
            · {{ formatHoursNum(w.payroll.totals.hours) }} {{ $t('portal.timesheet.hoursShort') }}
            · {{ $t('portal.pay.otShort') }} {{ formatHoursNum(w.payroll.totals.otHours) }}
            <span v-if="w.payroll.totals.restViolationHours" class="text-signal-500">
              · {{ $t('portal.pay.restViolation') }} {{ formatHoursNum(w.payroll.totals.restViolationHours) }}
            </span>
          </p>
        </div>
        <span v-if="w.payroll" class="font-semibold text-bone-100">{{ formatIsk(w.payroll.totals.amount, locale) }}</span>
        <PortalWeekStatusBadge :status="w.status" />
      </div>

      <p v-if="!filtered.length" class="p-8 text-center text-sm text-bone-400">{{ $t('portal.history.empty') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TimesheetWeek, WeekPayroll } from '~/types'

definePageMeta({ layout: 'portal' })

const { memberships } = usePortalAuth()
const { t, locale } = useI18n()

type WeekRow = TimesheetWeek & { payroll: WeekPayroll | null, jobName: string, companyName: string }

const jobs = computed(() => memberships.value?.jobs ?? [])
const filterJob = ref('')
const weeks = ref<WeekRow[]>([])
const loaded = ref(false)
const loadError = ref('')

const load = async () => {
  loadError.value = ''
  try {
    const results = await Promise.all(jobs.value.map(async (j) => {
      const rows = await $fetch<(TimesheetWeek & { payroll: WeekPayroll | null })[]>(
        `/api/portal/my/jobs/${j.jobId}/weeks`, { query: { t: Date.now() } })
      return rows.map(w => ({ ...w, jobName: j.jobName, companyName: j.companyName }))
    }))
    weeks.value = results.flat().sort((a, b) => b.weekStart.localeCompare(a.weekStart))
    loaded.value = true
  }
  catch (e: any) {
    loadError.value = e?.data?.statusMessage || t('portal.loadFailed')
  }
}

watch(jobs, (v) => {
  if (v.length) load()
  else loaded.value = true
}, { immediate: true })

const filtered = computed(() =>
  filterJob.value ? weeks.value.filter(w => w.jobId === filterJob.value) : weeks.value)

useHead({ title: 'History · Portal · Creative Filmmaking' })
</script>
