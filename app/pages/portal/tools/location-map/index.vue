<template>
  <PortalToolsShell
    :title="$t('portal.tools.locationMap.title')"
    :desc="$t('portal.tools.locationMap.intro')"
    :back-to="jobId ? localePath(`/portal/jobs/${jobId}`) : undefined"
    :back-label="jobId ? $t('portal.tools.backToJob') : undefined"
  >
    <!-- Create new map -->
    <form class="flex flex-wrap gap-3" @submit.prevent="create">
      <input
        v-model="newName"
        type="text"
        class="input-dark flex-1 min-w-56"
        :placeholder="$t('portal.tools.locationMap.namePlaceholder')"
        maxlength="120"
      >
      <button type="submit" class="btn-gold disabled:opacity-50" :disabled="!newName.trim() || creating">
        {{ creating ? $t('portal.tools.working') : $t('portal.tools.locationMap.newMap') }}
      </button>
    </form>

    <p v-if="error" class="mt-4 text-sm text-signal-500">{{ error }}</p>

    <!-- Saved maps -->
    <div v-if="maps.length" class="mt-8 divide-y divide-ink-800 border border-ink-800">
      <div
        v-for="m in maps"
        :key="m.id"
        class="flex items-center gap-4 p-4 hover:bg-ink-900 transition-colors"
      >
        <NuxtLink :to="docLink(m.id)" class="flex-1 min-w-0">
          <p class="font-semibold text-bone-100 truncate">{{ m.name }}</p>
          <p class="mt-0.5 text-xs text-bone-500">
            {{ $t('portal.tools.locationMap.pageCount', { n: m.pageCount }, m.pageCount) }}
            · {{ $t('portal.tools.locationMap.updated') }} {{ formatDate(m.updatedAt) }}
          </p>
        </NuxtLink>
        <NuxtLink
          :to="docLink(m.id)"
          class="text-xs uppercase tracking-widest text-bone-500 hover:text-gold-400 transition-colors"
        >
          {{ $t('portal.tools.open') }} →
        </NuxtLink>
        <button
          type="button"
          class="text-bone-600 hover:text-signal-500 transition-colors"
          :title="$t('portal.tools.remove')"
          @click="remove(m)"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
          </svg>
        </button>
      </div>
    </div>
    <p v-else-if="loaded" class="mt-8 text-sm text-bone-500">{{ $t('portal.tools.locationMap.empty') }}</p>
  </PortalToolsShell>
</template>

<script setup lang="ts">
import type { LocationMapDoc, LocationMapSummary } from '~/types'

definePageMeta({ layout: 'portal' })
usePortalToolGuard('location-map')

const { t, locale } = useI18n()
const { confirmDialog } = useAppDialog()
const localePath = useLocalePath()
const route = useRoute()

// Job scope (?job=): the list shows only this job's maps and new maps are
// linked to it ("Hjálpargögn" on the job page).
const jobId = computed(() => (typeof route.query.job === 'string' ? route.query.job : ''))
const docLink = (id: string) =>
  localePath({ path: `/portal/tools/location-map/${id}`, query: jobId.value ? { job: jobId.value } : {} })

const maps = ref<LocationMapSummary[]>([])
const loaded = ref(false)
const newName = ref('')
const creating = ref(false)
const error = ref('')

const load = async () => {
  try {
    maps.value = await $fetch<LocationMapSummary[]>('/api/portal/tools/location-maps', {
      query: jobId.value ? { job: jobId.value } : {},
    })
  }
  catch {
    error.value = t('portal.tools.locationMap.loadFailed')
  }
  finally {
    loaded.value = true
  }
}
onMounted(load)

const create = async () => {
  if (!newName.value.trim() || creating.value) return
  creating.value = true
  error.value = ''
  try {
    const doc = await $fetch<LocationMapDoc>('/api/portal/tools/location-maps', {
      method: 'POST',
      body: { name: newName.value.trim(), ...(jobId.value ? { jobId: jobId.value } : {}) },
    })
    await navigateTo(docLink(doc.id))
  }
  catch {
    error.value = t('portal.tools.locationMap.saveFailed')
    creating.value = false
  }
}

const remove = async (m: LocationMapSummary) => {
  if (!await confirmDialog(t('portal.tools.locationMap.confirmDelete'))) return
  try {
    await $fetch(`/api/portal/tools/location-maps/${m.id}`, { method: 'DELETE' })
    maps.value = maps.value.filter(x => x.id !== m.id)
  }
  catch {
    error.value = t('portal.tools.locationMap.saveFailed')
  }
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(locale.value === 'is' ? 'is-IS' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

useHead({ title: 'Tökustaðakort · Hjálpartól · Portal' })
</script>
