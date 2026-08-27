<template>
  <PortalToolsShell
    :title="$t('portal.tools.locationPhotos.title')"
    :desc="$t('portal.tools.locationPhotos.intro')"
    :back-to="jobId ? localePath(`/portal/jobs/${jobId}`) : undefined"
    :back-label="jobId ? $t('portal.tools.backToJob') : undefined"
  >
    <!-- Create a new location folder -->
    <form class="flex flex-wrap gap-3" @submit.prevent="create">
      <input
        v-model="newName"
        type="text"
        class="input-dark flex-1 min-w-56"
        :placeholder="$t('portal.tools.locationPhotos.namePlaceholder')"
        maxlength="120"
      >
      <button type="submit" class="btn-gold disabled:opacity-50" :disabled="!newName.trim() || creating">
        {{ creating ? $t('portal.tools.working') : $t('portal.tools.locationPhotos.newAlbum') }}
      </button>
      <NuxtLink
        :to="localePath({ path: '/portal/tools/location-photos/map', query: jobId ? { job: jobId } : {} })"
        class="inline-flex items-center gap-1.5 border border-ink-700 px-4 py-2 text-xs uppercase tracking-widest text-bone-300 hover:border-gold-500 hover:text-gold-300 transition-colors"
      >
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        {{ $t('portal.tools.locationPhotos.overviewMap') }}
      </NuxtLink>
    </form>

    <p v-if="error" class="mt-4 text-sm text-signal-500">{{ error }}</p>

    <!-- Location folders -->
    <div v-if="albums.length" class="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
      <div v-for="a in albums" :key="a.id" class="group relative">
        <NuxtLink
          :to="albumLink(a.id)"
          class="block overflow-hidden border border-ink-800 bg-ink-900 transition-colors hover:border-ink-600"
        >
          <div class="relative aspect-[4/3] w-full bg-ink-950">
            <img
              v-if="a.coverPhotoId"
              :src="coverUrl(a)"
              alt=""
              loading="lazy"
              class="h-full w-full object-cover"
            >
            <div v-else class="flex h-full w-full items-center justify-center text-bone-700">
              <svg class="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
                <path d="M3 5h18v14H3zM3 15l5-5 4 4 3-3 6 6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
            <span
              v-if="a.childCount > 0"
              class="absolute left-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              :class="a.decidedOptionName ? 'bg-emerald-500/90 text-ink-950' : 'bg-ink-950/80 text-bone-400'"
            >
              {{ a.decidedOptionName ? '✓ ' + $t('portal.tools.locationPhotos.decided') : $t('portal.tools.locationPhotos.undecided') }}
            </span>
          </div>
          <div class="p-3">
            <p class="flex items-center gap-1.5 truncate font-semibold text-bone-100">
              <span class="inline-block h-2.5 w-2.5 shrink-0 rounded-full" :style="{ backgroundColor: a.color }" />
              {{ a.name }}
            </p>
            <p class="mt-0.5 truncate text-xs text-bone-500">
              <template v-if="a.childCount > 0 && a.decidedOptionName">{{ $t('portal.tools.locationPhotos.chosenIs', { name: a.decidedOptionName }) }}</template>
              <template v-else>{{ countLabel(a) }}</template>
            </p>
          </div>
        </NuxtLink>
        <button
          type="button"
          class="absolute right-2 top-2 rounded-full bg-ink-950/80 p-1.5 text-bone-400 opacity-0 transition-opacity hover:text-signal-500 group-hover:opacity-100"
          :title="$t('portal.tools.remove')"
          @click="remove(a)"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
          </svg>
        </button>
      </div>
    </div>
    <p v-else-if="loaded" class="mt-8 text-sm text-bone-500">{{ $t('portal.tools.locationPhotos.empty') }}</p>
  </PortalToolsShell>
</template>

<script setup lang="ts">
import type { LocationAlbumDetail, LocationAlbumSummary } from '~/types'

definePageMeta({ layout: 'portal' })
usePortalToolGuard('location-photos')

const { t } = useI18n()
const { confirmDialog } = useAppDialog()
const localePath = useLocalePath()
const route = useRoute()

// Job scope (?job=): only this job's location folders are listed and new
// folders are linked to it ("Hjálpargögn" on the job page).
const jobId = computed(() => (typeof route.query.job === 'string' ? route.query.job : ''))
const albumLink = (id: string) =>
  localePath({ path: `/portal/tools/location-photos/${id}`, query: jobId.value ? { job: jobId.value } : {} })

const albums = ref<LocationAlbumSummary[]>([])
const loaded = ref(false)
const newName = ref('')
const creating = ref(false)
const error = ref('')

const coverUrl = (a: LocationAlbumSummary) =>
  `/api/portal/tools/location-albums/${a.id}/photos/${a.coverPhotoId}/file?size=thumb`

const countLabel = (a: LocationAlbumSummary) => {
  const parts: string[] = []
  if (a.childCount) parts.push(t('portal.tools.locationPhotos.folderCount', { n: a.childCount }, a.childCount))
  if (a.photoCount) parts.push(t('portal.tools.locationPhotos.photoCount', { n: a.photoCount }, a.photoCount))
  return parts.join(' · ') || t('portal.tools.locationPhotos.emptyShort')
}

const load = async () => {
  try {
    albums.value = await $fetch<LocationAlbumSummary[]>('/api/portal/tools/location-albums', {
      query: jobId.value ? { job: jobId.value } : {},
    })
  }
  catch {
    error.value = t('portal.tools.locationPhotos.loadFailed')
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
    const album = await $fetch<LocationAlbumDetail>('/api/portal/tools/location-albums', {
      method: 'POST',
      body: { name: newName.value.trim(), ...(jobId.value ? { jobId: jobId.value } : {}) },
    })
    await navigateTo(albumLink(album.id))
  }
  catch {
    error.value = t('portal.tools.locationPhotos.saveFailed')
    creating.value = false
  }
}

const remove = async (a: LocationAlbumSummary) => {
  if (!await confirmDialog(t('portal.tools.locationPhotos.confirmDeleteAlbum', { name: a.name }))) return
  try {
    await $fetch(`/api/portal/tools/location-albums/${a.id}`, { method: 'DELETE' })
    albums.value = albums.value.filter(x => x.id !== a.id)
  }
  catch {
    error.value = t('portal.tools.locationPhotos.saveFailed')
  }
}

useHead({ title: 'Tökustaðamyndir · Hjálpartól · Portal' })
</script>
