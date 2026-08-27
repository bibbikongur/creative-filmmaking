<template>
  <div class="max-w-5xl">
    <!-- Breadcrumb -->
    <nav class="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs uppercase tracking-widest text-bone-500">
      <NuxtLink :to="localePath({ path: '/portal/tools/location-photos', query: jobQuery })" class="hover:text-gold-400 transition-colors">
        {{ $t('portal.tools.locationPhotos.allAlbums') }}
      </NuxtLink>
      <template v-for="c in album?.breadcrumb ?? []" :key="c.id">
        <span class="text-bone-700">›</span>
        <NuxtLink :to="localePath({ path: `/portal/tools/location-photos/${c.id}`, query: jobQuery })" class="hover:text-gold-400 transition-colors truncate max-w-[10rem]">
          {{ c.name }}
        </NuxtLink>
      </template>
    </nav>

    <div v-if="album" class="mt-4">
      <!-- Title (inline rename) + note -->
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <input
            v-model="album.name"
            class="w-full max-w-xl bg-transparent text-3xl font-semibold uppercase tracking-wide text-bone-100 outline-none focus:text-gold-300"
            maxlength="120"
            @change="saveMeta"
          >
          <textarea
            v-model="noteDraft"
            rows="2"
            class="mt-2 w-full max-w-xl resize-y whitespace-pre-wrap rounded border border-ink-800 bg-ink-950/40 px-3 py-2 text-sm text-bone-300 outline-none placeholder:text-bone-600 focus:border-ink-600 focus:text-bone-100"
            :placeholder="$t('portal.tools.locationPhotos.descriptionPlaceholder')"
            maxlength="1000"
            @change="saveMeta"
          />
        </div>
      </div>

      <!-- Choose + rating for an option (this folder is itself an option) -->
      <div v-if="isOption" class="mt-3 flex flex-wrap items-center gap-4">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded border px-3 py-1 text-xs uppercase tracking-widest transition-colors"
          :class="album.chosen ? 'border-gold-500 bg-gold-500 text-ink-950' : 'border-ink-700 text-bone-300 hover:border-gold-500 hover:text-gold-300'"
          @click="toggleSelfChosen"
        >
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7" /></svg>
          {{ album.chosen ? $t('portal.tools.locationPhotos.isChosen') : $t('portal.tools.locationPhotos.choose') }}
        </button>
        <div class="flex items-center gap-1.5">
          <span class="text-xs uppercase tracking-widest text-bone-500">{{ $t('portal.tools.locationPhotos.rating') }}</span>
          <div class="flex">
            <button
              v-for="s in stars"
              :key="s"
              type="button"
              class="p-0.5 transition-colors"
              :class="s <= album.rating ? 'text-gold-400' : 'text-bone-700 hover:text-bone-500'"
              :aria-label="`${s}`"
              @click="saveRating(s)"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" :fill="s <= album.rating ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"><path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9z" /></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Pin color for this location; option subfolders inherit it -->
      <div v-if="showColor" class="mt-3 flex flex-wrap items-center gap-2">
        <span class="text-xs uppercase tracking-widest text-bone-500">{{ $t('portal.tools.locationPhotos.pinColor') }}</span>
        <button
          v-for="c in pinColors"
          :key="c"
          type="button"
          class="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
          :class="album.color === c ? 'border-bone-100' : 'border-transparent'"
          :style="{ backgroundColor: c }"
          :title="c"
          @click="saveColor(c)"
        />
        <button
          type="button"
          class="rounded-full border px-2 py-0.5 text-xs transition-colors"
          :class="!album.color ? 'border-bone-300 text-bone-200' : 'border-ink-700 text-bone-500 hover:text-bone-300'"
          :title="$t('portal.tools.locationPhotos.autoColor')"
          @click="saveColor(null)"
        >
          {{ $t('portal.tools.locationPhotos.autoColor') }}
        </button>
      </div>

      <p v-if="error" class="mt-3 text-sm text-signal-500">{{ error }}</p>

      <!-- Subfolders (options) + location pin -->
      <div class="mt-6 grid gap-8" :class="{ 'md:grid-cols-2': !isOption && showPin }">
        <!-- Subfolders: shown on locations / standalone folders, not on an option -->
        <section v-if="!isOption">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-xs font-semibold uppercase tracking-widest text-bone-500">
              {{ $t('portal.tools.locationPhotos.subfolders') }}
            </h2>
            <div class="flex items-center gap-3">
              <div v-if="album.children.length" class="inline-flex overflow-hidden rounded border border-ink-700 text-xs">
                <button
                  v-for="opt in filterOptions"
                  :key="opt.key"
                  type="button"
                  class="px-2 py-0.5 transition-colors"
                  :class="filterMode === opt.key ? 'bg-gold-500 text-ink-950' : 'bg-ink-900 text-bone-400 hover:text-bone-100'"
                  @click="filterMode = opt.key"
                >{{ opt.label }}</button>
              </div>
              <NuxtLink
                v-if="album.children.length"
                :to="localePath({ path: '/portal/tools/location-photos/map', query: { root: album.id, ...jobQuery } })"
                class="whitespace-nowrap text-xs uppercase tracking-widest text-bone-500 hover:text-gold-400 transition-colors"
              >
                {{ $t('portal.tools.locationPhotos.overviewMap') }} →
              </NuxtLink>
            </div>
          </div>

          <form class="mt-3 flex gap-2" @submit.prevent="createChild">
            <input
              v-model="childName"
              type="text"
              class="input-dark flex-1 min-w-0"
              :placeholder="$t('portal.tools.locationPhotos.subfolderPlaceholder')"
              maxlength="120"
            >
            <button type="submit" class="btn-gold shrink-0 disabled:opacity-50" :disabled="!childName.trim() || creatingChild">
              {{ creatingChild ? $t('portal.tools.working') : $t('portal.tools.locationPhotos.addSubfolder') }}
            </button>
          </form>

          <div v-if="visibleChildren.length" class="mt-4 grid grid-cols-2 gap-3">
            <div v-for="c in visibleChildren" :key="c.id" class="group relative">
              <NuxtLink
                :to="localePath({ path: `/portal/tools/location-photos/${c.id}`, query: jobQuery })"
                class="block overflow-hidden border bg-ink-900 transition-colors hover:border-ink-600"
                :class="c.chosen ? 'border-gold-500/70' : 'border-ink-800'"
              >
                <div class="relative aspect-[4/3] w-full bg-ink-950">
                  <img v-if="c.coverPhotoId" :src="coverUrl(c)" alt="" loading="lazy" class="h-full w-full object-cover">
                  <div v-else class="flex h-full w-full items-center justify-center text-bone-700">
                    <svg class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
                      <path d="M3 6h6l2 2h10v10H3z" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </div>
                  <!-- Decided badge for a location (folder with option subfolders) -->
                  <span
                    v-if="c.childCount > 0"
                    class="absolute left-1.5 top-1.5 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                    :class="c.decidedOptionName ? 'bg-emerald-500/90 text-ink-950' : 'bg-ink-950/80 text-bone-400'"
                  >
                    {{ c.decidedOptionName ? '✓ ' + $t('portal.tools.locationPhotos.decided') : $t('portal.tools.locationPhotos.undecided') }}
                  </span>
                </div>
                <div class="p-2.5">
                  <p class="flex items-center gap-1.5 truncate text-sm font-semibold text-bone-100">
                    <span class="inline-block h-2.5 w-2.5 shrink-0 rounded-full" :style="{ backgroundColor: c.color }" />
                    {{ c.name }}
                  </p>
                  <p class="mt-0.5 truncate text-xs text-bone-500">
                    <template v-if="c.childCount > 0 && c.decidedOptionName">{{ $t('portal.tools.locationPhotos.chosenIs', { name: c.decidedOptionName }) }}</template>
                    <template v-else>{{ countLabel(c) }}</template>
                  </p>
                </div>
              </NuxtLink>

              <!-- Rating (1–5) for an option -->
              <div v-if="c.childCount === 0" class="mt-1 flex items-center gap-0.5">
                <button
                  v-for="s in stars"
                  :key="s"
                  type="button"
                  class="p-0.5 transition-colors"
                  :class="s <= c.rating ? 'text-gold-400' : 'text-bone-700 hover:text-bone-500'"
                  :aria-label="`${s}`"
                  @click="setChildRating(c, s)"
                >
                  <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" :fill="s <= c.rating ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"><path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9z" /></svg>
                </button>
              </div>

              <!-- Choose toggle: mark an option (a leaf folder) as picked -->
              <button
                v-if="c.childCount === 0"
                type="button"
                class="absolute left-1.5 top-1.5 rounded-full p-1 transition-colors"
                :class="c.chosen ? 'bg-gold-500 text-ink-950' : 'bg-ink-950/80 text-bone-400 opacity-0 hover:text-gold-300 group-hover:opacity-100'"
                :title="c.chosen ? $t('portal.tools.locationPhotos.unchoose') : $t('portal.tools.locationPhotos.choose')"
                @click="toggleChosen(c)"
              >
                <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </button>

              <button
                type="button"
                class="absolute right-1.5 top-1.5 rounded-full bg-ink-950/80 p-1 text-bone-400 opacity-0 transition-opacity hover:text-signal-500 group-hover:opacity-100"
                :title="$t('portal.tools.remove')"
                @click="removeChild(c)"
              >
                <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                  <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                </svg>
              </button>
            </div>
          </div>
          <p v-else-if="album.children.length" class="mt-4 text-sm text-bone-600">{{ $t('portal.tools.locationPhotos.noneMatch') }}</p>
          <p v-else class="mt-4 text-sm text-bone-600">{{ $t('portal.tools.locationPhotos.noSubfolders') }}</p>
        </section>

        <!-- Location pin (options / standalone leaf folders only) -->
        <section v-if="showPin">
          <h2 class="text-xs font-semibold uppercase tracking-widest text-bone-500">
            {{ $t('portal.tools.locationPhotos.location') }}
          </h2>
          <div class="mt-3">
            <PortalToolsLocationPin v-model="coords" :color="album.displayColor" @update:model-value="saveCoords" />
          </div>
        </section>
      </div>

      <!-- Photos (options / standalone leaf folders only) -->
      <section v-if="showPhotos" class="mt-10">
        <h2 class="flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-bone-500">
          <span>{{ $t('portal.tools.locationPhotos.photos') }}</span>
          <span v-if="album.photos.length" class="normal-case tracking-normal text-bone-500">
            {{ $t('portal.tools.locationPhotos.photoCount', { n: album.photos.length }, album.photos.length) }}
          </span>
        </h2>

        <label
          class="mt-3 flex flex-col items-center justify-center gap-2 border-2 border-dashed px-6 py-8 text-center transition-colors"
          :class="[dragging ? 'border-gold-500 bg-gold-500/5' : 'border-ink-700 hover:border-ink-600 bg-ink-900/40', busy ? 'cursor-wait opacity-60' : 'cursor-pointer']"
          @dragover.prevent="dragging = true"
          @dragleave.prevent="dragging = false"
          @drop.prevent="onDrop"
        >
          <svg class="w-8 h-8 text-bone-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 16V4m0 0L8 8m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
          </svg>
          <span class="text-sm text-bone-300">{{ $t('portal.tools.locationPhotos.uploadHint') }}</span>
          <span class="text-xs text-bone-500">{{ $t('portal.tools.locationPhotos.uploadFormats') }}</span>
          <input ref="fileInput" type="file" class="hidden" accept="image/jpeg,image/png,image/webp" multiple :disabled="busy" @change="onPick">
        </label>

        <p v-if="progress" class="mt-3 text-sm text-gold-300">{{ progress }}</p>

        <div v-if="album.photos.length" class="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          <button
            v-for="(p, i) in album.photos"
            :key="p.id"
            type="button"
            class="group relative aspect-square overflow-hidden border border-ink-800 bg-ink-950 transition-colors hover:border-ink-500"
            @click="openViewer(i)"
          >
            <img :src="thumbUrl(p)" :alt="p.caption || p.originalName" loading="lazy" class="h-full w-full object-cover transition-transform group-hover:scale-105">
            <span
              v-if="p.id === album.coverPhotoId"
              class="absolute left-1.5 top-1.5 rounded bg-ink-950/80 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-gold-300"
            >{{ $t('portal.tools.locationPhotos.cover') }}</span>
            <span v-if="p.caption" class="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-ink-950/90 to-transparent px-2 py-1.5 text-left text-xs text-bone-200">{{ p.caption }}</span>
          </button>
        </div>
        <p v-else-if="!busy" class="mt-4 text-sm text-bone-500">{{ $t('portal.tools.locationPhotos.emptyAlbum') }}</p>
      </section>
    </div>

    <p v-else-if="loaded" class="mt-8 text-sm text-signal-500">{{ $t('portal.tools.locationPhotos.notFound') }}</p>

    <!-- Lightbox -->
    <div
      v-if="viewerIndex !== null && current"
      class="fixed inset-0 z-[2000] flex flex-col bg-ink-950/95 backdrop-blur"
      @click.self="closeViewer"
    >
      <div class="flex items-center justify-between gap-4 p-4">
        <span class="truncate text-sm text-bone-400">{{ current.originalName }}</span>
        <div class="flex items-center gap-2 text-xs uppercase tracking-widest">
          <button type="button" class="text-bone-400 hover:text-gold-400" @click="setCover(current)">
            {{ current.id === album?.coverPhotoId ? $t('portal.tools.locationPhotos.isCover') : $t('portal.tools.locationPhotos.makeCover') }}
          </button>
          <button type="button" class="text-bone-400 hover:text-signal-500" @click="removePhoto(current)">
            {{ $t('portal.tools.remove') }}
          </button>
          <button type="button" class="ml-2 text-bone-300 hover:text-bone-100" @click="closeViewer">✕</button>
        </div>
      </div>

      <div class="relative flex flex-1 items-center justify-center overflow-hidden px-4">
        <button
          v-if="album && album.photos.length > 1"
          type="button"
          class="absolute left-2 rounded-full bg-ink-900/70 p-3 text-bone-200 hover:bg-ink-800 hover:text-gold-400"
          @click="step(-1)"
        >‹</button>
        <img :src="fullUrl(current)" :alt="current.caption || current.originalName" class="max-h-full max-w-full object-contain">
        <button
          v-if="album && album.photos.length > 1"
          type="button"
          class="absolute right-2 rounded-full bg-ink-900/70 p-3 text-bone-200 hover:bg-ink-800 hover:text-gold-400"
          @click="step(1)"
        >›</button>
      </div>

      <div class="p-4">
        <input
          v-model="captionDraft"
          class="input-dark mx-auto block w-full max-w-xl text-center"
          :placeholder="$t('portal.tools.locationPhotos.captionPlaceholder')"
          maxlength="300"
          @change="saveCaption"
          @click.stop
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LocationAlbumDetail, LocationAlbumSummary, LocationPhoto } from '~/types'
import { downscaleImage } from '~/utils/toolFiles'
import { PIN_COLORS } from '~/utils/locationMap'

definePageMeta({ layout: 'portal' })
usePortalToolGuard('location-photos')

const { t } = useI18n()
const { confirmDialog } = useAppDialog()
const localePath = useLocalePath()
const route = useRoute()
const albumId = computed(() => route.params.id as string)

const pinColors = PIN_COLORS
type FilterKey = 'all' | 'chosen' | 'unchosen'
const filterMode = ref<FilterKey>('all')
const filterOptions = computed(() => [
  { key: 'all' as const, label: t('portal.tools.locationPhotos.filterAll') },
  { key: 'chosen' as const, label: t('portal.tools.locationPhotos.filterChosen') },
  { key: 'unchosen' as const, label: t('portal.tools.locationPhotos.filterUnchosen') },
])
// A folder counts as "decided" if it is a chosen option, or a location whose
// option was picked.
const isDecided = (c: LocationAlbumSummary) => c.childCount > 0 ? !!c.decidedOptionId : c.chosen
const visibleChildren = computed(() => {
  const list = album.value?.children ?? []
  if (filterMode.value === 'chosen') return list.filter(isDecided)
  if (filterMode.value === 'unchosen') return list.filter(c => !isDecided(c))
  return list
})

// A folder with subfolders is a "location" (tökustaður) container; a leaf folder
// is an "option" (or a standalone album). Locations get a description + colour;
// options (and standalone leaves) get a map pin + photos.
const hasChildren = computed(() => (album.value?.children.length ?? 0) > 0)
const isOption = computed(() => !!album.value?.parentId && !hasChildren.value)
const showColor = computed(() => !isOption.value) // containers + root leaves set the colour
const showPin = computed(() => !hasChildren.value) // only leaves carry a location
const showPhotos = computed(() => !hasChildren.value)
const stars = [1, 2, 3, 4, 5]

const album = ref<LocationAlbumDetail | null>(null)

// Keep the job scope (?job=) through breadcrumbs and subfolder links so the
// whole tree stays anchored to the job it was opened from. Falls back to the
// folder's own job link (resolved from its root) on a direct open.
const jobQuery = computed(() => {
  const job = (typeof route.query.job === 'string' && route.query.job) || album.value?.jobId || ''
  return job ? { job } : {}
})
const noteDraft = ref('')
const coords = ref<{ lat: number, lng: number } | null>(null)
const loaded = ref(false)
const error = ref('')
const progress = ref('')
const busy = ref(false)
const dragging = ref(false)
const childName = ref('')
const creatingChild = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const viewerIndex = ref<number | null>(null)
const captionDraft = ref('')
const current = computed(() =>
  viewerIndex.value !== null ? album.value?.photos[viewerIndex.value] ?? null : null)

const apiBase = computed(() => `/api/portal/tools/location-albums/${albumId.value}`)
const thumbUrl = (p: LocationPhoto) => `${apiBase.value}/photos/${p.id}/file?size=thumb`
const fullUrl = (p: LocationPhoto) => `${apiBase.value}/photos/${p.id}/file?size=full`
const coverUrl = (c: LocationAlbumSummary) =>
  `/api/portal/tools/location-albums/${c.id}/photos/${c.coverPhotoId}/file?size=thumb`

const countLabel = (c: LocationAlbumSummary) => {
  const parts: string[] = []
  if (c.childCount) parts.push(t('portal.tools.locationPhotos.folderCount', { n: c.childCount }, c.childCount))
  if (c.photoCount) parts.push(t('portal.tools.locationPhotos.photoCount', { n: c.photoCount }, c.photoCount))
  return parts.join(' · ') || t('portal.tools.locationPhotos.emptyShort')
}

const load = async () => {
  try {
    const a = await $fetch<LocationAlbumDetail>(apiBase.value)
    album.value = a
    noteDraft.value = a.note ?? ''
    coords.value = a.lat != null && a.lng != null ? { lat: a.lat, lng: a.lng } : null
  }
  catch {
    album.value = null
  }
  finally {
    loaded.value = true
  }
}
onMounted(load)
// Navigating between folders reuses this component — reload on id change.
watch(albumId, () => { loaded.value = false; load() })

const saveMeta = async () => {
  if (!album.value) return
  try {
    const updated = await $fetch<LocationAlbumDetail>(apiBase.value, {
      method: 'PATCH',
      body: { name: album.value.name, note: noteDraft.value },
    })
    album.value.name = updated.name
    album.value.note = updated.note
    noteDraft.value = updated.note ?? ''
  }
  catch {
    error.value = t('portal.tools.locationPhotos.saveFailed')
  }
}

const saveCoords = async (value: { lat: number, lng: number } | null) => {
  if (!album.value) return
  try {
    const updated = await $fetch<LocationAlbumDetail>(apiBase.value, {
      method: 'PATCH',
      body: { coords: value },
    })
    album.value.lat = updated.lat
    album.value.lng = updated.lng
  }
  catch {
    error.value = t('portal.tools.locationPhotos.saveFailed')
  }
}

const saveColor = async (color: string | null) => {
  if (!album.value) return
  try {
    // The response resolves inherited colors for the children too.
    const updated = await $fetch<LocationAlbumDetail>(apiBase.value, { method: 'PATCH', body: { color } })
    album.value.color = updated.color
    album.value.displayColor = updated.displayColor
    album.value.children = updated.children
  }
  catch {
    error.value = t('portal.tools.locationPhotos.saveFailed')
  }
}

const toggleChosen = async (c: LocationAlbumSummary) => {
  const next = !c.chosen
  try {
    await $fetch(`/api/portal/tools/location-albums/${c.id}`, { method: 'PATCH', body: { chosen: next } })
    c.chosen = next
  }
  catch {
    error.value = t('portal.tools.locationPhotos.saveFailed')
  }
}

// Rating/choose for a child option card (in a location view).
const setChildRating = async (c: LocationAlbumSummary, n: number) => {
  const next = c.rating === n ? 0 : n // click the current top star again to clear
  try {
    await $fetch(`/api/portal/tools/location-albums/${c.id}`, { method: 'PATCH', body: { rating: next } })
    c.rating = next
  }
  catch {
    error.value = t('portal.tools.locationPhotos.saveFailed')
  }
}

// Rating/choose for THIS folder (on an option's own page).
const saveRating = async (n: number) => {
  if (!album.value) return
  const next = album.value.rating === n ? 0 : n
  try {
    await $fetch(apiBase.value, { method: 'PATCH', body: { rating: next } })
    album.value.rating = next
  }
  catch {
    error.value = t('portal.tools.locationPhotos.saveFailed')
  }
}

const toggleSelfChosen = async () => {
  if (!album.value) return
  const next = !album.value.chosen
  try {
    await $fetch(apiBase.value, { method: 'PATCH', body: { chosen: next } })
    album.value.chosen = next
  }
  catch {
    error.value = t('portal.tools.locationPhotos.saveFailed')
  }
}

const createChild = async () => {
  if (!childName.value.trim() || creatingChild.value || !album.value) return
  creatingChild.value = true
  error.value = ''
  try {
    const child = await $fetch<LocationAlbumDetail>('/api/portal/tools/location-albums', {
      method: 'POST',
      body: { name: childName.value.trim(), parentId: albumId.value },
    })
    album.value.children.push({
      ...child,
      photoCount: 0,
      childCount: 0,
      color: child.displayColor,
      chosen: child.chosen,
    })
    album.value.children.sort((a, b) => a.name.localeCompare(b.name, 'is'))
    childName.value = ''
  }
  catch {
    error.value = t('portal.tools.locationPhotos.saveFailed')
  }
  finally {
    creatingChild.value = false
  }
}

const removeChild = async (c: LocationAlbumSummary) => {
  if (!album.value || !await confirmDialog(t('portal.tools.locationPhotos.confirmDeleteAlbum', { name: c.name }))) return
  try {
    await $fetch(`/api/portal/tools/location-albums/${c.id}`, { method: 'DELETE' })
    album.value.children = album.value.children.filter(x => x.id !== c.id)
  }
  catch {
    error.value = t('portal.tools.locationPhotos.saveFailed')
  }
}

// Uploads
const onPick = (e: Event) => {
  const input = e.target as HTMLInputElement
  handleFiles(Array.from(input.files ?? []))
  input.value = ''
}
const onDrop = (e: DragEvent) => {
  dragging.value = false
  handleFiles(Array.from(e.dataTransfer?.files ?? []).filter(f => f.type.startsWith('image/')))
}

const handleFiles = async (files: File[]) => {
  if (!files.length || busy.value || !album.value) return
  busy.value = true
  error.value = ''
  let done = 0
  let failed = 0
  for (const file of files) {
    progress.value = t('portal.tools.locationPhotos.uploading', { done: done + 1, total: files.length })
    try {
      const full = await downscaleImage(file, 2560, 'image/jpeg', 0.85)
      const thumb = await downscaleImage(file, 480, 'image/jpeg', 0.72)
      const form = new FormData()
      form.append('full', full.blob, 'full.jpg')
      form.append('thumb', thumb.blob, 'thumb.jpg')
      form.append('originalName', file.name)
      form.append('width', String(full.width))
      form.append('height', String(full.height))
      const photo = await $fetch<LocationPhoto>(`${apiBase.value}/photos`, { method: 'POST', body: form })
      album.value.photos.push(photo)
      if (!album.value.coverPhotoId) album.value.coverPhotoId = photo.id
    }
    catch {
      failed++
    }
    done++
  }
  busy.value = false
  progress.value = ''
  if (failed) error.value = t('portal.tools.locationPhotos.someFailed', { n: failed })
}

// Lightbox
const openViewer = (i: number) => {
  viewerIndex.value = i
  captionDraft.value = album.value?.photos[i]?.caption ?? ''
}
const closeViewer = () => { viewerIndex.value = null }
const step = (dir: -1 | 1) => {
  if (viewerIndex.value === null || !album.value) return
  const n = album.value.photos.length
  viewerIndex.value = (viewerIndex.value + dir + n) % n
  captionDraft.value = current.value?.caption ?? ''
}

const onKey = (e: KeyboardEvent) => {
  if (viewerIndex.value === null) return
  if (e.key === 'Escape') closeViewer()
  else if (e.key === 'ArrowLeft') step(-1)
  else if (e.key === 'ArrowRight') step(1)
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

const saveCaption = async () => {
  if (!current.value) return
  const photo = current.value
  try {
    const updated = await $fetch<LocationPhoto>(`${apiBase.value}/photos/${photo.id}`, {
      method: 'PATCH',
      body: { caption: captionDraft.value },
    })
    photo.caption = updated.caption
  }
  catch {
    error.value = t('portal.tools.locationPhotos.saveFailed')
  }
}

const setCover = async (photo: LocationPhoto) => {
  if (!album.value) return
  try {
    await $fetch(apiBase.value, { method: 'PATCH', body: { coverPhotoId: photo.id } })
    album.value.coverPhotoId = photo.id
  }
  catch {
    error.value = t('portal.tools.locationPhotos.saveFailed')
  }
}

const removePhoto = async (photo: LocationPhoto) => {
  if (!album.value || !await confirmDialog(t('portal.tools.locationPhotos.confirmDeletePhoto'))) return
  try {
    await $fetch(`${apiBase.value}/photos/${photo.id}`, { method: 'DELETE' })
    const idx = album.value.photos.findIndex(p => p.id === photo.id)
    album.value.photos = album.value.photos.filter(p => p.id !== photo.id)
    if (album.value.coverPhotoId === photo.id) {
      album.value.coverPhotoId = album.value.photos[0]?.id
    }
    if (!album.value.photos.length) closeViewer()
    else if (viewerIndex.value !== null) {
      viewerIndex.value = Math.min(idx, album.value.photos.length - 1)
      captionDraft.value = current.value?.caption ?? ''
    }
  }
  catch {
    error.value = t('portal.tools.locationPhotos.saveFailed')
  }
}

useHead({ title: 'Tökustaðamyndir · Hjálpartól · Portal' })
</script>
