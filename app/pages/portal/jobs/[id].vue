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

      <!-- Crew lives on its own page now -->
      <div v-if="isAdmin" class="mt-8 border border-ink-800 bg-ink-900/50 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="kicker">{{ $t('portal.crew.title') }}</p>
          <p class="mt-2 text-sm text-bone-400">{{ memberCount }} {{ $t('portal.jobs.members', memberCount) }}</p>
        </div>
        <NuxtLink :to="localePath(`/portal/crew/${jobId}`)" class="btn-gold !px-5 !py-2.5">
          {{ $t('portal.crew.manage') }} →
        </NuxtLink>
      </div>

      <!-- Timesheets -->
      <div v-if="timesheetCards.length" class="mt-8 border border-ink-800 bg-ink-900/50 p-5">
        <p class="kicker">{{ $t('portal.jobTimesheets.title') }}</p>
        <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NuxtLink
            v-for="card in timesheetCards"
            :key="card.key"
            :to="localePath(card.to)"
            class="group flex flex-col gap-3 border border-ink-800 bg-ink-950/40 p-5 hover:border-gold-500/60 hover:bg-ink-900 transition-colors"
          >
            <span class="flex h-11 w-11 items-center justify-center border border-ink-700 text-gold-500 group-hover:border-gold-500/60 transition-colors">
              <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path :d="card.icon" />
              </svg>
            </span>
            <div>
              <p class="font-semibold text-bone-100">{{ $t(`portal.jobTimesheets.${card.key}.title`) }}</p>
              <p class="mt-1 text-sm text-bone-400">{{ $t(`portal.jobTimesheets.${card.key}.desc`) }}</p>
            </div>
            <span class="mt-auto text-xs uppercase tracking-widest text-bone-500 group-hover:text-gold-400 transition-colors">
              {{ $t('portal.tools.open') }} →
            </span>
          </NuxtLink>
        </div>
      </div>

      <!-- Purchase orders: create, review and approve, all scoped to this job -->
      <div v-if="canReviewHere" class="mt-8 border border-ink-800 bg-ink-900/50 p-5">
        <p class="kicker">{{ $t('portal.jobPo.title') }}</p>
        <p class="mt-2 text-sm text-bone-400">{{ $t('portal.jobPo.desc') }}</p>
        <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NuxtLink
            v-for="card in poCards"
            :key="card.key"
            :to="localePath(card.to)"
            class="group flex flex-col gap-3 border border-ink-800 bg-ink-950/40 p-5 hover:border-gold-500/60 hover:bg-ink-900 transition-colors"
          >
            <span class="flex h-11 w-11 items-center justify-center border border-ink-700 text-gold-500 group-hover:border-gold-500/60 transition-colors">
              <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path :d="card.icon" />
              </svg>
            </span>
            <div>
              <p class="font-semibold text-bone-100">{{ $t(`portal.jobPo.${card.key}.title`) }}</p>
              <p class="mt-1 text-sm text-bone-400">{{ $t(`portal.jobPo.${card.key}.desc`) }}</p>
            </div>
            <span class="mt-auto text-xs uppercase tracking-widest text-bone-500 group-hover:text-gold-400 transition-colors">
              {{ $t('portal.tools.open') }} →
            </span>
          </NuxtLink>
        </div>
      </div>

      <!-- Helper tools, grouped by category: everything opens scoped on this job via ?job= -->
      <div v-if="jobToolGroups.length" class="mt-8 border border-ink-800 bg-ink-900/50 p-5">
        <p class="kicker">{{ $t('portal.jobTools.title') }}</p>
        <p class="mt-2 text-sm text-bone-400">{{ $t('portal.jobTools.desc') }}</p>
        <div v-for="group in jobToolGroups" :key="group.key" class="mt-6 first-of-type:mt-4">
          <p class="text-xs uppercase tracking-widest text-gold-500/90 border-b border-ink-800 pb-2">{{ $t(group.labelKey) }}</p>
          <div class="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <NuxtLink
              v-for="tool in group.tools"
              :key="tool.slug"
              :to="localePath(tool.to)"
              class="group flex flex-col gap-3 border border-ink-800 bg-ink-950/40 p-5 hover:border-gold-500/60 hover:bg-ink-900 transition-colors"
            >
              <span class="flex h-11 w-11 items-center justify-center border border-ink-700 text-gold-500 group-hover:border-gold-500/60 transition-colors">
                <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path :d="tool.icon" />
                </svg>
              </span>
              <div>
                <p class="font-semibold text-bone-100">{{ $t(tool.titleKey) }}</p>
                <p class="mt-1 text-sm text-bone-400">{{ $t(tool.descKey) }}</p>
              </div>
              <span class="mt-auto text-xs uppercase tracking-widest text-bone-500 group-hover:text-gold-400 transition-colors">
                {{ $t('portal.tools.open') }} →
              </span>
            </NuxtLink>
          </div>
        </div>
        <p class="mt-5 text-xs text-bone-500 flex items-center gap-2">
          <svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="5" y="11" width="14" height="9" rx="1.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
          {{ $t('portal.tools.privacy') }}
        </p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Job } from '~/types'

definePageMeta({ layout: 'portal' })

const route = useRoute()
const localePath = useLocalePath()
const { t } = useI18n()
const { memberships, canUseTool } = usePortalAuth()
const jobId = computed(() => String(route.params.id))

const job = ref<Job | null>(null)
const memberCount = ref(0)
const isAdmin = ref(false)
const loaded = ref(false)
const loadError = ref('')

// Role on THIS job: crew members register hours, reviewers approve them.
const isMember = computed(() => Boolean(memberships.value?.jobs.some(j => j.jobId === jobId.value)))
const isDeptAdminHere = computed(() => Boolean(memberships.value?.deptAdmin.some(d => d.jobId === jobId.value)))
const canReviewHere = computed(() => isAdmin.value || isDeptAdminHere.value)

// Timesheet entry points, styled like the tools cards; each opens pre-filtered on this job.
const timesheetCards = computed(() => [
  ...(isMember.value
    ? [
        {
          key: 'register',
          to: { path: '/portal/timesheet', query: { job: jobId.value } },
          // Clock
          icon: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7.5V12l3 2',
        },
        {
          key: 'history',
          to: { path: '/portal/history', query: { job: jobId.value } },
          // Stacked list with a check
          icon: 'M4 5h10M4 9.5h10M4 14h6M14.5 15.5l2.5 2.5 4.5-5',
        },
      ]
    : []),
  ...(canReviewHere.value
    ? [
        {
          key: 'review',
          to: { path: '/portal/timesheets', query: { job: jobId.value } },
          // Clipboard with a check
          icon: 'M9 3h6v3H9zM15 4h2a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 13l2.5 2.5L15.5 11',
        },
        {
          key: 'dashboard',
          to: { path: '/portal/dashboard', query: { job: jobId.value } },
          // Bar chart
          icon: 'M4 4v16h16M8 16v-5M12.5 16V8M17 16v-3',
        },
      ]
    : []),
])

// Purchase-order entry points, styled like the tools cards. All three open the
// same PO tool scoped on this job (?job=); ?focus= tells it where to land:
// the new-order form, the full list, or the pending queue ready to approve.
const poCards = computed(() => [
  {
    key: 'create',
    to: { path: '/portal/tools/purchase-orders', query: { job: jobId.value, focus: 'create' } },
    // Document with a plus
    icon: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9.5 14.5h5M12 12v5',
  },
  {
    key: 'overview',
    to: { path: '/portal/tools/purchase-orders', query: { job: jobId.value, focus: 'list' } },
    // Receipt with item lines
    icon: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9.5 8h5M9.5 12h5M9.5 16h3',
  },
  {
    key: 'approve',
    to: { path: '/portal/tools/purchase-orders', query: { job: jobId.value, focus: 'approve' } },
    // Check inside a circle
    icon: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM8.5 12l2.5 2.5L15.5 10',
  },
])

// Every helper tool lives here now, grouped by category — pages open scoped
// on this job via ?job=, so anything saved there is linked to this job only.
// Cards honour the per-user tool access. Purchase orders have their own
// section above, so they are dropped from this grid to avoid showing up twice.
const { portalTools, toolCategories } = usePortalTools()
const jobToolGroups = computed(() => toolCategories
  .map(cat => ({
    ...cat,
    tools: portalTools
      .filter(tool => tool.category === cat.key)
      .filter(tool => tool.slug !== 'purchase-orders')
      .filter(tool => canUseTool(tool.slug))
      .map(tool => ({ ...tool, to: { path: `/portal/tools/${tool.slug}`, query: { job: jobId.value } } })),
  }))
  .filter(group => group.tools.length))

const load = async () => {
  loadError.value = ''
  try {
    const res = await $fetch<{ job: Job, memberCount: number, isAdmin: boolean }>(
      `/api/portal/jobs/${jobId.value}/summary`, { query: { t: Date.now() } })
    job.value = res.job
    memberCount.value = res.memberCount
    isAdmin.value = res.isAdmin
    loaded.value = true
  }
  catch (e: any) {
    loadError.value = e?.data?.statusMessage || t('portal.loadFailed')
  }
}

onMounted(load)

useHead({ title: 'Job · Portal · Creative Filmmaking' })
</script>
