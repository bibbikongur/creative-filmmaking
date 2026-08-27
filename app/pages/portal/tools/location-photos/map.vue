<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <NuxtLink
        :to="backTo"
        class="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-bone-500 hover:text-gold-400 transition-colors"
      >
        ← {{ $t('portal.tools.locationPhotos.allAlbums') }}
      </NuxtLink>
      <div class="inline-flex overflow-hidden rounded border border-ink-700 text-xs">
        <button
          type="button"
          class="px-2.5 py-1 transition-colors"
          :class="base === 'streets' ? 'bg-gold-500 text-ink-950' : 'bg-ink-900 text-bone-400 hover:text-bone-100'"
          @click="setBase('streets')"
        >{{ $t('portal.tools.locationPhotos.baseStreets') }}</button>
        <button
          type="button"
          class="px-2.5 py-1 transition-colors"
          :class="base === 'satellite' ? 'bg-gold-500 text-ink-950' : 'bg-ink-900 text-bone-400 hover:text-bone-100'"
          @click="setBase('satellite')"
        >{{ $t('portal.tools.locationPhotos.baseSatellite') }}</button>
      </div>
    </div>

    <h1 class="mt-3 text-2xl font-semibold uppercase tracking-wide text-bone-100">
      {{ $t('portal.tools.locationPhotos.overviewTitle') }}
    </h1>

    <div class="relative mt-4">
      <!-- Leaflet owns this div: never bind a reactive :class here. -->
      <div ref="mapEl" class="h-[70vh] w-full rounded border border-ink-800 bg-ink-950" />

      <!-- Empty state -->
      <div
        v-if="loaded && !pins.length"
        class="pointer-events-none absolute inset-0 flex items-center justify-center p-6 text-center"
      >
        <p class="max-w-sm rounded bg-ink-950/85 px-4 py-3 text-sm text-bone-400">
          {{ $t('portal.tools.locationPhotos.noPins') }}
        </p>
      </div>

      <!-- Selected folder card -->
      <div
        v-if="selected"
        class="absolute bottom-4 left-4 right-4 z-[500] mx-auto max-w-sm overflow-hidden rounded border border-ink-700 bg-ink-950/95 shadow-xl backdrop-blur"
      >
        <img
          v-if="selected.coverPhotoId"
          :src="pinThumb(selected)"
          alt=""
          class="h-32 w-full object-cover"
        >
        <div class="p-4">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="flex items-center gap-1.5 truncate font-semibold text-bone-100">
                <span class="inline-block h-2.5 w-2.5 shrink-0 rounded-full" :style="{ backgroundColor: selected.color }" />
                <span v-if="selected.chosen" class="text-gold-400">★</span>
                {{ selected.name }}
              </p>
              <p v-if="selected.path.length > 1" class="mt-0.5 truncate text-xs text-bone-500">
                {{ selected.path.slice(0, -1).join(' › ') }}
              </p>
              <div class="mt-1 flex items-center gap-2 text-xs text-bone-500">
                <span v-if="selected.rating" class="text-gold-400">{{ '★'.repeat(selected.rating) }}<span class="text-bone-700">{{ '★'.repeat(5 - selected.rating) }}</span></span>
                <span>{{ $t('portal.tools.locationPhotos.photoCount', { n: selected.photoCount }, selected.photoCount) }}</span>
              </div>
            </div>
            <button type="button" class="text-bone-500 hover:text-bone-200" @click="selected = null">✕</button>
          </div>
          <NuxtLink
            :to="localePath({ path: `/portal/tools/location-photos/${selected.id}`, query: jobId ? { job: jobId } : {} })"
            class="mt-3 inline-block text-xs uppercase tracking-widest text-gold-400 hover:text-gold-300"
          >
            {{ $t('portal.tools.open') }} →
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type * as Leaflet from 'leaflet'
import type { LocationAlbumPin } from '~/types'
import { ICELAND_CENTER, ICELAND_ZOOM, loadLeaflet, pinDivIcon } from '~/utils/leaflet'
import { TILE_SOURCES } from '~/utils/locationMap'

definePageMeta({ layout: 'portal' })
usePortalToolGuard('location-photos')

const localePath = useLocalePath()
const route = useRoute()
const rootId = computed(() => (typeof route.query.root === 'string' ? route.query.root : ''))
// Job scope (?job=): only pins whose root folder is linked to the job.
const jobId = computed(() => (typeof route.query.job === 'string' ? route.query.job : ''))

const backTo = computed(() =>
  localePath({
    path: rootId.value ? `/portal/tools/location-photos/${rootId.value}` : '/portal/tools/location-photos',
    query: jobId.value ? { job: jobId.value } : {},
  }))

const mapEl = ref<HTMLElement | null>(null)
const base = ref<'streets' | 'satellite'>('streets')
const pins = ref<LocationAlbumPin[]>([])
const selected = ref<LocationAlbumPin | null>(null)

const pinThumb = (pin: LocationAlbumPin) =>
  `/api/portal/tools/location-albums/${pin.id}/photos/${pin.coverPhotoId}/file?size=thumb`
const loaded = ref(false)

let L: typeof Leaflet
let map: Leaflet.Map | null = null
let tiles: Leaflet.TileLayer | null = null

const setBase = (b: 'streets' | 'satellite') => {
  base.value = b
  if (!tiles) return
  const src = TILE_SOURCES[b]
  tiles.setUrl(src.url)
  tiles.options.maxZoom = src.maxZoom
  tiles.options.attribution = src.attribution
}

const renderPins = () => {
  if (!map || !L) return
  const latlngs: [number, number][] = []
  for (const pin of pins.value) {
    // Chosen options are drawn with a star; every pin uses its location's color.
    const m = L.marker([pin.lat, pin.lng], { icon: pinDivIcon(L, pin.color, pin.chosen ? '★' : ' ') }).addTo(map)
    m.bindTooltip(pin.chosen ? `★ ${pin.name}` : pin.name, { direction: 'top', offset: [0, -34], opacity: 0.95 })
    m.on('click', () => { selected.value = pin })
    latlngs.push([pin.lat, pin.lng])
  }
  if (latlngs.length === 1) {
    map.setView(latlngs[0]!, 14)
  }
  else if (latlngs.length > 1) {
    map.fitBounds(latlngs, { padding: [50, 50] })
  }
}

onMounted(async () => {
  L = await loadLeaflet()
  if (!mapEl.value) return
  map = L.map(mapEl.value, { zoomControl: true })
  map.setView(ICELAND_CENTER, ICELAND_ZOOM)
  const src = TILE_SOURCES.streets
  tiles = L.tileLayer(src.url, { maxZoom: src.maxZoom, attribution: src.attribution, crossOrigin: true }).addTo(map)
  map.on('click', () => { selected.value = null })

  try {
    pins.value = await $fetch<LocationAlbumPin[]>('/api/portal/tools/location-albums/pins', {
      query: {
        ...(rootId.value ? { root: rootId.value } : {}),
        ...(jobId.value ? { job: jobId.value } : {}),
      },
    })
  }
  catch {
    pins.value = []
  }
  finally {
    loaded.value = true
  }
  renderPins()
  setTimeout(() => map?.invalidateSize(), 60)
})

onBeforeUnmount(() => {
  if (map) { map.remove(); map = null }
})

useHead({ title: 'Yfirlitskort · Tökustaðamyndir · Portal' })
</script>
