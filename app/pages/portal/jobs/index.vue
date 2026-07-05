<template>
  <div>
    <div>
      <p class="kicker">{{ $t('portal.nav.jobs') }}</p>
      <h1 class="mt-2 text-3xl font-semibold uppercase tracking-wide text-bone-100">{{ $t('portal.jobs.title') }}</h1>
    </div>

    <!-- Create job -->
    <form class="mt-8 border border-ink-800 bg-ink-900/50 p-5 flex flex-wrap items-end gap-4" @submit.prevent="create">
      <div class="flex-1 min-w-56">
        <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.jobs.jobName') }}</label>
        <input v-model="newName" type="text" class="input-dark" :placeholder="$t('portal.jobs.namePlaceholder')" required>
      </div>
      <button type="submit" class="btn-gold disabled:opacity-60" :disabled="creating || !newName.trim()">
        {{ creating ? '…' : $t('portal.jobs.create') }}
      </button>
      <p v-if="createError" class="w-full text-sm text-signal-500">{{ createError }}</p>
    </form>

    <p v-if="loadError" class="mt-8 text-sm text-signal-500">{{ loadError }}</p>
    <p v-else-if="!loaded" class="mt-8 text-sm text-bone-400">{{ $t('portal.loading') }}</p>

    <div v-else class="mt-8 border border-ink-800 divide-y divide-ink-800">
      <NuxtLink
        v-for="j in jobs"
        :key="j.id"
        :to="localePath(`/portal/jobs/${j.id}`)"
        class="flex flex-wrap items-center gap-4 p-4 bg-ink-900/50 hover:bg-ink-900 transition-colors"
      >
        <div class="min-w-0 flex-1">
          <p class="font-semibold text-bone-100 truncate">
            {{ j.name }}
            <span v-if="j.status === 'closed'" class="ml-2 text-xs uppercase tracking-widest text-bone-400">{{ $t('portal.jobs.closed') }}</span>
          </p>
          <p class="mt-0.5 text-xs text-bone-400">
            {{ j.memberCount }} {{ $t('portal.jobs.members', j.memberCount) }}
            <span v-if="j.pendingWeeks" class="text-gold-400"> · {{ j.pendingWeeks }} {{ $t('portal.jobs.pendingWeeks', j.pendingWeeks) }}</span>
          </p>
        </div>
        <button
          type="button"
          class="text-xs uppercase tracking-widest text-bone-400 hover:text-gold-400 transition-colors disabled:opacity-50"
          :disabled="busy === j.id"
          @click.prevent.stop="toggle(j)"
        >
          {{ j.status === 'active' ? $t('portal.jobs.close') : $t('portal.jobs.reopen') }}
        </button>
      </NuxtLink>

      <p v-if="!jobs.length" class="p-8 text-center text-sm text-bone-400">{{ $t('portal.jobs.empty') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Job } from '~/types'

definePageMeta({ layout: 'portal' })

type JobRow = Job & { memberCount: number, pendingWeeks: number }

const localePath = useLocalePath()
const { t } = useI18n()

const jobs = ref<JobRow[]>([])
const loaded = ref(false)
const loadError = ref('')
const newName = ref('')
const creating = ref(false)
const createError = ref('')
const busy = ref('')

const load = async () => {
  loadError.value = ''
  try {
    jobs.value = await $fetch<JobRow[]>('/api/portal/jobs', { query: { t: Date.now() } })
    loaded.value = true
  }
  catch (e: any) {
    loadError.value = e?.data?.statusMessage || t('portal.loadFailed')
  }
}

onMounted(load)

const create = async () => {
  createError.value = ''
  creating.value = true
  try {
    await $fetch('/api/portal/jobs', { method: 'POST', body: { name: newName.value } })
    newName.value = ''
    await load()
  }
  catch (e: any) {
    createError.value = e?.data?.data?.errors?.[0] || e?.data?.statusMessage || t('portal.loadFailed')
  }
  finally {
    creating.value = false
  }
}

const toggle = async (j: JobRow) => {
  busy.value = j.id
  try {
    const next = j.status === 'active' ? 'closed' : 'active'
    await $fetch(`/api/portal/jobs/${j.id}`, { method: 'PATCH', body: { status: next } })
    j.status = next
  }
  catch (e: any) {
    alert(e?.data?.statusMessage || t('portal.loadFailed'))
  }
  finally {
    busy.value = ''
  }
}

useHead({ title: 'Jobs · Portal · Creative Filmmaking' })
</script>
