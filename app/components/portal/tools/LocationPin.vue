<template>
  <div>
    <div class="flex items-center justify-between gap-2">
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
      <button
        v-if="modelValue"
        type="button"
        class="text-xs uppercase tracking-widest text-bone-500 hover:text-signal-500 transition-colors"
        @click="clear"
      >{{ $t('portal.tools.locationPhotos.clearLocation') }}</button>
    </div>

    <!-- Leaflet owns this div: never bind a reactive :class here. -->
    <div ref="mapEl" class="mt-2 h-64 w-full rounded border border-ink-800 bg-ink-950" />

    <p class="mt-1.5 text-xs text-bone-500">
      <template v-if="modelValue">{{ modelValue.lat.toFixed(5) }}, {{ modelValue.lng.toFixed(5) }}</template>
      <template v-else>{{ $t('portal.tools.locationPhotos.pinHint') }}</template>
    </p>
  </div>
</template>

<script setup lang="ts">
import type * as Leaflet from 'leaflet'
import { ICELAND_CENTER, ICELAND_ZOOM, loadLeaflet, pinDivIcon } from '~/utils/leaflet'
import { TILE_SOURCES } from '~/utils/locationMap'

const props = withDefaults(defineProps<{
  modelValue: { lat: number, lng: number } | null
  color?: string
}>(), { color: '#e6007e' })
const emit = defineEmits<{ 'update:modelValue': [{ lat: number, lng: number } | null] }>()

const mapEl = ref<HTMLElement | null>(null)
const base = ref<'streets' | 'satellite'>('streets')

let L: typeof Leaflet
let map: Leaflet.Map | null = null
let tiles: Leaflet.TileLayer | null = null
let marker: Leaflet.Marker | null = null

const drawMarker = (coords: { lat: number, lng: number } | null) => {
  if (!map) return
  if (!coords) {
    if (marker) { marker.remove(); marker = null }
    return
  }
  if (marker) {
    marker.setLatLng([coords.lat, coords.lng])
    marker.setIcon(pinDivIcon(L, props.color))
  }
  else {
    marker = L.marker([coords.lat, coords.lng], { icon: pinDivIcon(L, props.color), draggable: true }).addTo(map)
    marker.on('dragend', () => {
      const p = marker!.getLatLng()
      emit('update:modelValue', { lat: p.lat, lng: p.lng })
    })
  }
}

const setBase = (b: 'streets' | 'satellite') => {
  base.value = b
  if (!map || !tiles) return
  const src = TILE_SOURCES[b]
  tiles.setUrl(src.url)
  tiles.options.maxZoom = src.maxZoom
  tiles.options.attribution = src.attribution
}

onMounted(async () => {
  L = await loadLeaflet()
  if (!mapEl.value) return
  const start = props.modelValue
  map = L.map(mapEl.value, { zoomControl: true, attributionControl: true })
  map.setView(start ? [start.lat, start.lng] : ICELAND_CENTER, start ? 15 : ICELAND_ZOOM)
  const src = TILE_SOURCES.streets
  tiles = L.tileLayer(src.url, { maxZoom: src.maxZoom, attribution: src.attribution, crossOrigin: true }).addTo(map)
  map.on('click', (e: Leaflet.LeafletMouseEvent) => {
    emit('update:modelValue', { lat: e.latlng.lat, lng: e.latlng.lng })
  })
  drawMarker(start)
  // The card may mount while hidden/animating; make sure tiles fill the box.
  setTimeout(() => map?.invalidateSize(), 60)
})

onBeforeUnmount(() => {
  if (map) { map.remove(); map = null }
})

// Keep the marker in sync when the parent updates coords (e.g. after save).
watch(() => props.modelValue, (v) => {
  drawMarker(v)
  if (v && map) map.setView([v.lat, v.lng], Math.max(map.getZoom(), 14))
})

// Recolor the marker when the folder's color changes.
watch(() => props.color, () => drawMarker(props.modelValue))

const clear = () => emit('update:modelValue', null)
</script>
