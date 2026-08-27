<template>
  <div class="max-w-2xl">
    <NuxtLink
      :to="backTo ?? defaultBack"
      class="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-bone-500 hover:text-gold-400 transition-colors"
    >
      ← {{ backLabel ?? defaultLabel }}
    </NuxtLink>
    <h1 class="mt-3 text-3xl font-semibold uppercase tracking-wide text-bone-100">{{ title }}</h1>
    <p v-if="desc" class="mt-2 text-sm text-bone-400">{{ desc }}</p>

    <div class="mt-8">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

// backTo/backLabel override the default back link. Tools live inside the jobs
// now: by default we link back to the job the tool was opened from (?job=),
// falling back to the job list when unscoped.
defineProps<{ title: string, desc?: string, backTo?: RouteLocationRaw, backLabel?: string }>()
const localePath = useLocalePath()
const route = useRoute()
const { t } = useI18n()

const jobId = computed(() => (typeof route.query.job === 'string' ? route.query.job : ''))
const defaultBack = computed(() => localePath(jobId.value ? `/portal/jobs/${jobId.value}` : '/portal/jobs'))
const defaultLabel = computed(() => (jobId.value ? t('portal.tools.backToJob') : t('portal.nav.jobs')))
</script>
