<template>
  <div>
    <div>
      <p class="kicker">{{ $t('portal.nav.crew') }}</p>
      <h1 class="mt-2 text-3xl font-semibold uppercase tracking-wide text-bone-100">{{ $t('portal.crew.title') }}</h1>
      <p class="mt-2 text-sm text-bone-400">{{ $t('portal.crew.pickJob') }}</p>
    </div>

    <p v-if="loadError" class="mt-8 text-sm text-signal-500">{{ loadError }}</p>
    <p v-else-if="!loaded" class="mt-8 text-sm text-bone-400">{{ $t('portal.loading') }}</p>

    <div v-else class="mt-8 border border-ink-800 divide-y divide-ink-800">
      <NuxtLink
        v-for="j in jobs"
        :key="j.id"
        :to="localePath(`/portal/crew/${j.id}`)"
        class="flex flex-wrap items-center gap-4 p-4 bg-ink-900/50 hover:bg-ink-900 transition-colors"
      >
        <div class="min-w-0 flex-1">
          <p class="font-semibold text-bone-100 truncate">
            {{ j.name }}
            <span v-if="j.status === 'closed'" class="ml-2 text-xs uppercase tracking-widest text-bone-400">{{ $t('portal.jobs.closed') }}</span>
          </p>
          <p class="mt-0.5 text-xs text-bone-400">{{ j.memberCount }} {{ $t('portal.jobs.members', j.memberCount) }}</p>
        </div>
        <span class="text-xs uppercase tracking-widest text-bone-400">→</span>
      </NuxtLink>

      <p v-if="!jobs.length" class="p-8 text-center text-sm text-bone-400">{{ $t('portal.jobs.empty') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Job } from '~/types'

definePageMeta({ layout: 'portal' })

type JobRow = Job & { memberCount: number, pendingWeeks: number, role: 'admin' | 'member' }

const localePath = useLocalePath()
const { t } = useI18n()

const jobs = ref<JobRow[]>([])
const loaded = ref(false)
const loadError = ref('')

onMounted(async () => {
  try {
    // Crew management is admin-only — the jobs endpoint also returns jobs the
    // user merely crews on, so keep just the ones they administer.
    jobs.value = (await $fetch<JobRow[]>('/api/portal/jobs', { query: { t: Date.now() } })).filter(j => j.role === 'admin')
    loaded.value = true
  }
  catch (e: any) {
    loadError.value = e?.data?.statusMessage || t('portal.loadFailed')
  }
})

useHead({ title: 'Crew · Portal · Creative Filmmaking' })
</script>
