<template>
  <div>
    <div>
      <p class="kicker">{{ $t('portal.nav.review') }}</p>
      <h1 class="mt-2 text-3xl font-semibold uppercase tracking-wide text-bone-100">{{ $t('portal.review.title') }}</h1>
    </div>

    <!-- Filters -->
    <div class="mt-6 flex flex-wrap items-center gap-3">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        class="px-3 py-1.5 text-xs uppercase tracking-widest border transition-colors"
        :class="statusFilter === tab.value ? 'border-gold-600 text-gold-400' : 'border-ink-800 text-bone-400 hover:text-bone-100'"
        @click="statusFilter = tab.value"
      >
        {{ tab.label }}
      </button>
      <select v-if="jobs.length > 1" v-model="jobFilter" class="input-dark !w-auto ml-auto">
        <option value="">{{ $t('portal.history.allJobs') }}</option>
        <option v-for="j in jobs" :key="j.id" :value="j.id">{{ j.name }}</option>
      </select>
    </div>

    <p v-if="loadError" class="mt-8 text-sm text-signal-500">{{ loadError }}</p>
    <p v-else-if="!loaded" class="mt-8 text-sm text-bone-400">{{ $t('portal.loading') }}</p>

    <div v-else class="mt-6 border border-ink-800 divide-y divide-ink-800">
      <NuxtLink
        v-for="w in weeks"
        :key="w.id"
        :to="localePath(`/portal/timesheets/${w.id}`)"
        class="flex flex-wrap items-center gap-4 p-4 bg-ink-900/50 hover:bg-ink-900 transition-colors"
      >
        <div class="min-w-0 flex-1">
          <p class="font-semibold text-bone-100 truncate">
            {{ w.userName || w.userEmail }}
            <span class="ml-2 text-xs font-normal text-bone-400">{{ w.jobName }}</span>
            <span v-if="w.departmentName" class="ml-1.5 text-xs font-normal text-gold-400/80">· {{ w.departmentName }}</span>
          </p>
          <p class="mt-0.5 text-xs text-bone-400">
            {{ formatWeekRange(w.weekStart, locale) }}
            · {{ formatHoursNum(w.totalMinutes / 60) }} {{ $t('portal.timesheet.hoursShort') }}
          </p>
        </div>
        <PortalWeekStatusBadge :status="w.status" />
      </NuxtLink>

      <p v-if="!weeks.length" class="p-8 text-center text-sm text-bone-400">{{ $t('portal.review.empty') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Job, TimesheetWeek, WeekStatus } from '~/types'

definePageMeta({ layout: 'portal' })

const localePath = useLocalePath()
const { t, locale } = useI18n()

type WeekRow = TimesheetWeek & { userName?: string, userEmail: string, jobName: string, departmentName?: string, totalMinutes: number }

const weeks = ref<WeekRow[]>([])
const jobs = ref<Job[]>([])
const loaded = ref(false)
const loadError = ref('')
const statusFilter = ref<'' | WeekStatus>('submitted')
const jobFilter = ref('')

const tabs = computed(() => [
  { value: 'submitted' as const, label: t('portal.status.submitted') },
  { value: 'dept_approved' as const, label: t('portal.status.dept_approved') },
  { value: 'altered' as const, label: t('portal.status.altered') },
  { value: 'approved' as const, label: t('portal.status.approved') },
  { value: '' as const, label: t('portal.review.all') },
])

const load = async () => {
  loadError.value = ''
  try {
    weeks.value = await $fetch<WeekRow[]>('/api/portal/timesheets', {
      query: {
        t: Date.now(),
        ...(statusFilter.value ? { status: statusFilter.value } : {}),
        ...(jobFilter.value ? { jobId: jobFilter.value } : {}),
      },
    })
    loaded.value = true
  }
  catch (e: any) {
    loadError.value = e?.data?.statusMessage || t('portal.loadFailed')
  }
}

onMounted(async () => {
  load()
  try {
    jobs.value = await $fetch<Job[]>('/api/portal/jobs', { query: { t: Date.now() } })
  }
  catch { /* job filter just stays hidden */ }
})

watch([statusFilter, jobFilter], load)

useHead({ title: 'Review · Portal · Creative Filmmaking' })
</script>
