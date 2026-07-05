<template>
  <div>
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="kicker">{{ $t('portal.nav.dashboard') }}</p>
        <h1 class="mt-2 text-3xl font-semibold uppercase tracking-wide text-bone-100">{{ $t('portal.dashboard.title') }}</h1>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <select v-if="jobs.length > 1" v-model="jobFilter" class="input-dark !w-auto">
          <option value="">{{ $t('portal.history.allJobs') }}</option>
          <option v-for="j in jobs" :key="j.id" :value="j.id">{{ j.name }}</option>
        </select>
        <select v-model="period" class="input-dark !w-auto">
          <option value="this-week">{{ $t('portal.dashboard.thisWeek') }}</option>
          <option value="last-week">{{ $t('portal.dashboard.lastWeek') }}</option>
          <option value="4-weeks">{{ $t('portal.dashboard.last4Weeks') }}</option>
          <option value="13-weeks">{{ $t('portal.dashboard.last13Weeks') }}</option>
        </select>
      </div>
    </div>

    <p v-if="loadError" class="mt-8 text-sm text-signal-500">{{ loadError }}</p>
    <p v-else-if="!loaded" class="mt-8 text-sm text-bone-400">{{ $t('portal.loading') }}</p>

    <template v-else-if="stats">
      <!-- Stat tiles -->
      <div class="mt-8 grid gap-4 grid-cols-2 lg:grid-cols-5">
        <div v-for="tile in tiles" :key="tile.label" class="border border-ink-800 bg-ink-900/50 p-4">
          <p class="text-xs uppercase tracking-widest text-bone-400">{{ tile.label }}</p>
          <p class="mt-2 text-2xl font-semibold" :class="tile.accent || 'text-bone-100'">{{ tile.value }}</p>
          <p v-if="tile.sub" class="mt-0.5 text-xs text-bone-400">{{ tile.sub }}</p>
        </div>
      </div>

      <!-- Weekly hours bars -->
      <div v-if="stats.perWeek.length > 1" class="mt-8 border border-ink-800 bg-ink-900/50 p-5">
        <p class="text-xs uppercase tracking-widest text-bone-400">{{ $t('portal.dashboard.weeklyHours') }}</p>
        <svg :viewBox="`0 0 ${stats.perWeek.length * 44} 120`" class="mt-4 w-full max-w-2xl" role="img">
          <g v-for="(w, i) in stats.perWeek" :key="w.weekStart">
            <rect
              :x="i * 44 + 6"
              :y="110 - barHeight(w.hours)"
              width="32"
              :height="barHeight(w.hours)"
              class="fill-gold-600/70"
            />
            <text :x="i * 44 + 22" y="118" text-anchor="middle" class="fill-bone-400 text-[8px]">
              {{ formatShortDate(w.weekStart, locale) }}
            </text>
            <text :x="i * 44 + 22" :y="104 - barHeight(w.hours)" text-anchor="middle" class="fill-bone-100 text-[9px]">
              {{ Math.round(w.hours) }}
            </text>
          </g>
        </svg>
      </div>

      <!-- Per-employee table -->
      <div class="mt-8 overflow-x-auto border border-ink-800">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-xs uppercase tracking-widest text-bone-400 border-b border-ink-800">
              <th class="p-3 font-normal">{{ $t('portal.dashboard.employee') }}</th>
              <th class="p-3 font-normal text-right">{{ $t('portal.pay.daysWorked') }}</th>
              <th class="p-3 font-normal text-right">{{ $t('portal.pay.hours') }}</th>
              <th class="p-3 font-normal text-right">{{ $t('portal.pay.otHours') }}</th>
              <th class="p-3 font-normal text-right">{{ $t('portal.pay.restViolation') }}</th>
              <th class="p-3 font-normal text-right">{{ $t('portal.pay.doubleDays') }}</th>
              <th class="p-3 font-normal text-right">{{ $t('portal.dashboard.pay') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-ink-800">
            <tr v-for="e in stats.perEmployee" :key="e.userId" class="bg-ink-900/50 hover:bg-ink-900 transition-colors">
              <td class="p-3">
                <p class="font-semibold text-bone-100">{{ e.name || e.email }}</p>
                <p class="text-xs text-bone-400">
                  {{ e.weeks }} {{ $t('portal.dashboard.weeks', e.weeks) }}
                  <span v-if="e.pendingWeeks" class="text-gold-400">· {{ e.pendingWeeks }} {{ $t('portal.dashboard.pending') }}</span>
                </p>
              </td>
              <td class="p-3 text-right text-bone-100">{{ e.daysWorked }}</td>
              <td class="p-3 text-right text-bone-100">{{ formatHoursNum(e.hours) }}</td>
              <td class="p-3 text-right" :class="e.otHours ? 'text-gold-400' : 'text-bone-400'">{{ formatHoursNum(e.otHours) }}</td>
              <td class="p-3 text-right" :class="e.restViolationHours ? 'text-signal-500' : 'text-bone-400'">{{ formatHoursNum(e.restViolationHours) }}</td>
              <td class="p-3 text-right" :class="e.doubleDays ? 'text-gold-400' : 'text-bone-400'">{{ e.doubleDays }}</td>
              <td class="p-3 text-right font-semibold text-bone-100">{{ formatIsk(e.amount, locale) }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="!stats.perEmployee.length" class="p-8 text-center text-sm text-bone-400">{{ $t('portal.dashboard.empty') }}</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Job } from '~/types'

definePageMeta({ layout: 'portal' })

const { t, locale } = useI18n()

interface Stats {
  from: string
  to: string
  totals: { daysWorked: number, hours: number, otHours: number, restViolationHours: number, doubleDays: number, amount: number, employees: number }
  perEmployee: { userId: string, name?: string, email: string, weeks: number, daysWorked: number, hours: number, otHours: number, restViolationHours: number, doubleDays: number, amount: number, pendingWeeks: number }[]
  perWeek: { weekStart: string, hours: number, amount: number }[]
}

const stats = ref<Stats | null>(null)
const jobs = ref<Job[]>([])
const loaded = ref(false)
const loadError = ref('')
const period = ref('4-weeks')
const jobFilter = ref('')

const range = computed(() => {
  const thisMonday = mondayOf(new Date())
  switch (period.value) {
    case 'this-week': return { from: thisMonday, to: thisMonday }
    case 'last-week': return { from: addDaysIso(thisMonday, -7), to: addDaysIso(thisMonday, -7) }
    case '13-weeks': return { from: addDaysIso(thisMonday, -7 * 12), to: thisMonday }
    default: return { from: addDaysIso(thisMonday, -7 * 3), to: thisMonday }
  }
})

const load = async () => {
  loadError.value = ''
  try {
    stats.value = await $fetch<Stats>('/api/portal/stats', {
      query: {
        t: Date.now(),
        from: range.value.from,
        to: range.value.to,
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
  catch { /* filter stays hidden */ }
})

watch([period, jobFilter], load)

const maxWeekHours = computed(() => Math.max(1, ...(stats.value?.perWeek.map(w => w.hours) ?? [1])))
const barHeight = (hours: number) => Math.max(2, Math.round(hours / maxWeekHours.value * 90))

const tiles = computed(() => {
  if (!stats.value) return []
  const s = stats.value.totals
  return [
    { label: t('portal.pay.daysWorked'), value: String(s.daysWorked), sub: `${s.employees} ${t('portal.dashboard.employeesShort')}` },
    { label: t('portal.pay.hours'), value: formatHoursNum(s.hours) },
    { label: t('portal.pay.otHours'), value: formatHoursNum(s.otHours), accent: s.otHours ? 'text-gold-400' : '' },
    { label: t('portal.pay.restViolation'), value: formatHoursNum(s.restViolationHours), accent: s.restViolationHours ? 'text-signal-500' : '' },
    { label: t('portal.dashboard.pay'), value: formatIsk(s.amount, locale.value), accent: 'text-gold-400' },
  ]
})

useHead({ title: 'Dashboard · Portal · Creative Filmmaking' })
</script>
