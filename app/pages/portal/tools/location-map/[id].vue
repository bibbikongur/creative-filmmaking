<template>
  <div>
    <NuxtLink
      :to="backTo"
      class="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-bone-500 hover:text-gold-400 transition-colors"
    >
      ← {{ $t('portal.tools.locationMap.backToList') }}
    </NuxtLink>

    <p v-if="notFound" class="mt-6 text-sm text-signal-500">{{ $t('portal.tools.locationMap.notFound') }}</p>

    <template v-else-if="doc">
      <!-- Header: name, save state, export -->
      <div class="mt-3 flex flex-wrap items-center gap-3">
        <input
          v-model="doc.name"
          type="text"
          maxlength="120"
          class="input-dark text-lg font-semibold flex-1 min-w-56"
          @input="markDirty"
        >
        <span class="text-xs text-bone-500 w-20">
          <template v-if="saveState === 'saving'">{{ $t('portal.tools.locationMap.saving') }}</template>
          <template v-else-if="saveState === 'saved'">{{ $t('portal.tools.locationMap.saved') }}</template>
          <template v-else-if="saveState === 'error'"><span class="text-signal-500">{{ $t('portal.tools.locationMap.saveFailed') }}</span></template>
        </span>
        <button type="button" class="btn-gold disabled:opacity-50" :disabled="exporting" @click="doExport">
          {{ exporting ? $t('portal.tools.locationMap.exporting') : $t('portal.tools.locationMap.export') }}
        </button>
      </div>
      <p v-if="exportError" class="mt-2 text-sm text-signal-500">{{ exportError }}</p>

      <!-- Page tabs -->
      <div class="mt-4 flex flex-wrap items-center gap-1.5">
        <button
          v-for="(p, i) in doc.pages"
          :key="p.id"
          type="button"
          class="px-3 py-1.5 text-xs uppercase tracking-widest border transition-colors"
          :class="i === pageIdx
            ? 'border-gold-500/60 text-gold-400 bg-ink-900'
            : 'border-ink-800 text-bone-500 hover:text-bone-300'"
          @click="switchPage(i)"
        >
          {{ p.title || `${i + 1}` }}
        </button>
        <button
          type="button"
          class="px-3 py-1.5 text-xs uppercase tracking-widest border border-dashed border-ink-700 text-bone-500 hover:text-gold-400 transition-colors"
          @click="addPage('map')"
        >
          + {{ $t('portal.tools.locationMap.pageTypeMap') }}
        </button>
        <button
          type="button"
          class="px-3 py-1.5 text-xs uppercase tracking-widest border border-dashed border-ink-700 text-bone-500 hover:text-gold-400 transition-colors"
          @click="addPage('image')"
        >
          + {{ $t('portal.tools.locationMap.pageTypeImage') }}
        </button>
      </div>

      <!-- Toolbar -->
      <div v-if="page" class="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3 border border-ink-800 bg-ink-900/50 p-3">
        <!-- Tool modes -->
        <div class="flex gap-1.5">
          <button
            v-for="mode in availableModes"
            :key="mode.id"
            type="button"
            class="px-3 py-1.5 text-xs border transition-colors"
            :class="tool === mode.id ? 'border-gold-500/60 text-gold-400 bg-ink-900' : 'border-ink-800 text-bone-400 hover:text-bone-200'"
            :title="$t(mode.labelKey)"
            @click="setTool(mode.id)"
          >
            {{ $t(mode.labelKey) }}
          </button>
        </div>

        <!-- Marker kind picker -->
        <div v-if="tool === 'marker'" class="flex items-center gap-1.5">
          <button
            v-for="k in MARKER_KINDS"
            :key="k.kind"
            type="button"
            class="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white border-2 transition-transform"
            :class="markerKind === k.kind ? 'border-gold-400 scale-110' : 'border-transparent opacity-70 hover:opacity-100'"
            :style="{ background: k.color }"
            :title="$t(k.labelKey)"
            @click="markerKind = k.kind"
          >
            {{ k.glyph }}
          </button>
          <span class="ml-1 text-xs text-bone-500">{{ $t(markerKindDef(markerKind).labelKey) }}</span>
        </div>

        <!-- Shape style -->
        <div v-if="tool === 'shape'" class="flex items-center gap-2">
          <button
            v-for="k in (['rect', 'circle'] as const)"
            :key="k"
            type="button"
            class="px-2.5 py-1 text-xs border transition-colors"
            :class="shapeKind === k ? 'border-gold-500/60 text-gold-400 bg-ink-900' : 'border-ink-800 text-bone-400 hover:text-bone-200'"
            @click="shapeKind = k"
          >
            {{ $t(k === 'rect' ? 'portal.tools.locationMap.shapeRect' : 'portal.tools.locationMap.shapeCircle') }}
          </button>
          <button
            v-for="c in ROAD_COLORS"
            :key="c"
            type="button"
            class="h-6 w-6 rounded-full border-2"
            :class="shapeStyle.color === c ? 'border-gold-400' : 'border-ink-700'"
            :style="{ background: c }"
            @click="shapeStyle.color = c"
          />
          <label class="flex items-center gap-1.5 text-xs text-bone-400">
            <input v-model="shapeStyle.fill" type="checkbox" class="accent-gold-500">
            {{ $t('portal.tools.locationMap.fill') }}
          </label>
          <input
            v-if="shapeStyle.fill"
            v-model.number="shapeStyle.fillOpacity"
            type="range"
            min="0.05"
            max="1"
            step="0.05"
            class="w-20 accent-gold-500"
            :title="$t('portal.tools.locationMap.opacity')"
          >
        </div>

        <!-- Vehicle preset picker -->
        <div v-if="tool === 'vehicle'" class="flex items-center gap-1.5">
          <button
            v-for="v in VEHICLE_KINDS"
            :key="v.kind"
            type="button"
            class="px-2.5 py-1 text-xs border transition-colors"
            :class="vehicleKind === v.kind ? 'border-gold-500/60 text-gold-400 bg-ink-900' : 'border-ink-800 text-bone-400 hover:text-bone-200'"
            @click="vehicleKind = v.kind"
          >
            {{ $t(v.labelKey) }} · {{ v.lengthM }}×{{ v.widthM }} m
          </button>
        </div>

        <!-- Road style -->
        <div v-if="tool === 'road'" class="flex items-center gap-2">
          <button
            v-for="c in ROAD_COLORS"
            :key="c"
            type="button"
            class="h-6 w-6 rounded-full border-2"
            :class="roadStyle.color === c ? 'border-gold-400' : 'border-ink-700'"
            :style="{ background: c }"
            @click="roadStyle.color = c"
          />
          <input v-model.number="roadStyle.width" type="range" min="2" max="12" class="w-20 accent-gold-500">
          <label class="flex items-center gap-1.5 text-xs text-bone-400">
            <input v-model="roadStyle.dashed" type="checkbox" class="accent-gold-500">
            {{ $t('portal.tools.locationMap.roadDashed') }}
          </label>
          <template v-if="drawing.length">
            <button type="button" class="text-xs text-bone-400 hover:text-bone-200 underline" @click="undoRoadPoint">
              {{ $t('portal.tools.locationMap.undoPoint') }}
            </button>
            <button type="button" class="text-xs text-gold-400 hover:text-gold-300 underline" @click="finishRoad">
              {{ $t('portal.tools.locationMap.finishRoad') }}
            </button>
          </template>
        </div>

        <div class="ml-auto flex items-center gap-3">
          <!-- Base layer toggle (map pages) / image replace (image pages) -->
          <div v-if="page.base !== 'image'" class="flex gap-1.5">
            <button
              v-for="b in (['streets', 'satellite'] as const)"
              :key="b"
              type="button"
              class="px-2.5 py-1 text-xs border transition-colors"
              :class="page.base === b ? 'border-gold-500/60 text-gold-400' : 'border-ink-800 text-bone-500 hover:text-bone-300'"
              @click="setBase(b)"
            >
              {{ $t(b === 'streets' ? 'portal.tools.locationMap.baseStreets' : 'portal.tools.locationMap.baseSatellite') }}
            </button>
          </div>
          <button
            v-else
            type="button"
            class="px-2.5 py-1 text-xs border border-ink-800 text-bone-500 hover:text-bone-300 transition-colors"
            @click="pickImage(true)"
          >
            {{ $t('portal.tools.locationMap.replaceImage') }}
          </button>

          <input
            v-model="page.title"
            type="text"
            maxlength="120"
            class="input-dark !py-1 text-xs w-40"
            :placeholder="$t('portal.tools.locationMap.pageTitle')"
            @input="markDirty"
          >
          <button
            type="button"
            class="text-bone-600 hover:text-signal-500 transition-colors"
            :title="$t('portal.tools.locationMap.confirmDeletePage')"
            @click="deletePage"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Hint line -->
      <p v-if="hint" class="mt-2 text-xs text-bone-500">{{ hint }}</p>

      <!-- Map + edit panel -->
      <div class="mt-3 flex gap-3">
        <!-- The reactive class lives on this wrapper, NOT on the Leaflet element:
             Vue rewrites the whole class attribute when a binding changes, which
             would wipe the classes Leaflet added to its own container. -->
        <div class="relative flex-1 min-w-0" :class="{ 'lm-crosshair': tool !== 'pan' }">
          <div ref="mapEl" class="h-[65vh] w-full border border-ink-800 bg-ink-950" />
          <!-- Production-map style title card (also drawn on the PDF). -->
          <div v-if="doc.name" class="lm-map-title">
            <div class="lm-map-title-main">{{ doc.name }}</div>
            <div v-if="page?.title" class="lm-map-title-sub">{{ page.title }}</div>
          </div>
        </div>

        <!-- Selection panel -->
        <div v-if="selectedItem" class="w-64 shrink-0 border border-ink-800 bg-ink-900/50 p-4 space-y-4 self-start">
          <template v-if="selected!.type === 'marker'">
            <div>
              <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.tools.locationMap.toolMarker') }}</label>
              <select v-model="(selectedItem as LocationMapMarker).kind" class="input-dark w-full" @change="onMarkerKindChange">
                <option v-for="k in MARKER_KINDS" :key="k.kind" :value="k.kind">{{ $t(k.labelKey) }}</option>
              </select>
            </div>
            <div v-if="(selectedItem as LocationMapMarker).kind === 'set'">
              <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.tools.locationMap.number') }}</label>
              <input
                v-model.number="(selectedItem as LocationMapMarker).num"
                type="number"
                min="1"
                max="999"
                class="input-dark w-full"
                @input="touch"
              >
            </div>
            <div>
              <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.tools.locationMap.label') }}</label>
              <input
                v-model="(selectedItem as LocationMapMarker).label"
                type="text"
                maxlength="120"
                class="input-dark w-full"
                @input="touch"
              >
            </div>
            <a
              v-if="page && page.base !== 'image'"
              :href="`https://www.google.com/maps?q=${(selectedItem as LocationMapMarker).lat.toFixed(6)},${(selectedItem as LocationMapMarker).lng.toFixed(6)}`"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center gap-1 text-xs text-gold-400 hover:text-gold-300 underline underline-offset-2"
            >
              {{ $t('portal.tools.locationMap.openMaps') }} ↗
            </a>
          </template>

          <template v-else-if="selected!.type === 'text'">
            <div>
              <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.tools.locationMap.textContent') }}</label>
              <textarea
                ref="textInput"
                v-model="(selectedItem as LocationMapText).text"
                rows="4"
                maxlength="500"
                class="input-dark w-full"
                @input="touch"
              />
            </div>
            <div>
              <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.tools.locationMap.fontSize') }}</label>
              <input
                v-model.number="(selectedItem as LocationMapText).size"
                type="range"
                min="10"
                max="32"
                class="w-full accent-gold-500"
                @input="touch"
              >
            </div>
            <div>
              <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.tools.locationMap.roadColor') }}</label>
              <div class="flex gap-1.5">
                <button
                  v-for="c in TEXT_COLORS"
                  :key="c"
                  type="button"
                  class="h-6 w-6 rounded-full border-2"
                  :class="((selectedItem as LocationMapText).color || DEFAULT_TEXT_COLOR) === c ? 'border-gold-400' : 'border-ink-700'"
                  :style="{ background: c }"
                  @click="(selectedItem as LocationMapText).color = c; touch()"
                />
              </div>
            </div>
          </template>

          <template v-else-if="selected!.type === 'vehicle'">
            <div>
              <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.tools.locationMap.toolVehicle') }}</label>
              <select v-model="(selectedItem as LocationMapVehicle).kind" class="input-dark w-full" @change="onVehicleKindChange">
                <option v-for="v in VEHICLE_KINDS" :key="v.kind" :value="v.kind">{{ $t(v.labelKey) }}</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.tools.locationMap.lengthM') }}</label>
                <input
                  v-model.number="(selectedItem as LocationMapVehicle).lengthM"
                  type="number"
                  min="1"
                  max="30"
                  step="0.1"
                  class="input-dark w-full"
                  @input="touch"
                >
              </div>
              <div>
                <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.tools.locationMap.widthM') }}</label>
                <input
                  v-model.number="(selectedItem as LocationMapVehicle).widthM"
                  type="number"
                  min="1"
                  max="6"
                  step="0.05"
                  class="input-dark w-full"
                  @input="touch"
                >
              </div>
            </div>
            <div>
              <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">
                {{ $t('portal.tools.locationMap.rotation') }} · {{ (selectedItem as LocationMapVehicle).rotation }}°
              </label>
              <input
                v-model.number="(selectedItem as LocationMapVehicle).rotation"
                type="range"
                min="0"
                max="359"
                class="w-full accent-gold-500"
                @input="touch"
              >
            </div>
            <div>
              <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.tools.locationMap.roadColor') }}</label>
              <div class="flex gap-1.5">
                <button
                  v-for="c in VEHICLE_COLORS"
                  :key="c"
                  type="button"
                  class="h-6 w-6 rounded-full border-2"
                  :class="(selectedItem as LocationMapVehicle).color === c ? 'border-gold-400' : 'border-ink-700'"
                  :style="{ background: c }"
                  @click="(selectedItem as LocationMapVehicle).color = c; touch()"
                />
              </div>
            </div>
            <div>
              <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.tools.locationMap.label') }}</label>
              <input
                v-model="(selectedItem as LocationMapVehicle).label"
                type="text"
                maxlength="120"
                class="input-dark w-full"
                @input="touch"
              >
            </div>
          </template>

          <template v-else-if="selected!.type === 'shape'">
            <div>
              <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.tools.locationMap.roadColor') }}</label>
              <div class="flex gap-1.5">
                <button
                  v-for="c in ROAD_COLORS"
                  :key="c"
                  type="button"
                  class="h-6 w-6 rounded-full border-2"
                  :class="(selectedItem as LocationMapShape).color === c ? 'border-gold-400' : 'border-ink-700'"
                  :style="{ background: c }"
                  @click="(selectedItem as LocationMapShape).color = c; touch()"
                />
              </div>
            </div>
            <div>
              <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.tools.locationMap.roadWidth') }}</label>
              <input
                v-model.number="(selectedItem as LocationMapShape).width"
                type="range"
                min="1"
                max="12"
                class="w-full accent-gold-500"
                @input="touch"
              >
            </div>
            <label class="flex items-center gap-2 text-sm text-bone-300">
              <input v-model="(selectedItem as LocationMapShape).fill" type="checkbox" class="accent-gold-500" @change="touch">
              {{ $t('portal.tools.locationMap.fill') }}
            </label>
            <div v-if="(selectedItem as LocationMapShape).fill">
              <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">
                {{ $t('portal.tools.locationMap.opacity') }} · {{ Math.round((selectedItem as LocationMapShape).fillOpacity * 100) }}%
              </label>
              <input
                v-model.number="(selectedItem as LocationMapShape).fillOpacity"
                type="range"
                min="0.05"
                max="1"
                step="0.05"
                class="w-full accent-gold-500"
                @input="touch"
              >
            </div>
          </template>

          <template v-else-if="selected!.type === 'road'">
            <div>
              <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.tools.locationMap.roadColor') }}</label>
              <div class="flex gap-1.5">
                <button
                  v-for="c in ROAD_COLORS"
                  :key="c"
                  type="button"
                  class="h-6 w-6 rounded-full border-2"
                  :class="(selectedItem as LocationMapRoad).color === c ? 'border-gold-400' : 'border-ink-700'"
                  :style="{ background: c }"
                  @click="(selectedItem as LocationMapRoad).color = c; touch()"
                />
              </div>
            </div>
            <div>
              <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.tools.locationMap.roadWidth') }}</label>
              <input
                v-model.number="(selectedItem as LocationMapRoad).width"
                type="range"
                min="2"
                max="12"
                class="w-full accent-gold-500"
                @input="touch"
              >
            </div>
            <label class="flex items-center gap-2 text-sm text-bone-300">
              <input v-model="(selectedItem as LocationMapRoad).dashed" type="checkbox" class="accent-gold-500" @change="touch">
              {{ $t('portal.tools.locationMap.roadDashed') }}
            </label>
          </template>

          <button type="button" class="w-full border border-signal-500/40 py-1.5 text-xs uppercase tracking-widest text-signal-500 hover:bg-signal-500/10 transition-colors" @click="deleteSelected">
            {{ $t('portal.tools.locationMap.remove') }}
          </button>
        </div>
      </div>
    </template>

    <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onImagePicked">
  </div>
</template>

<script setup lang="ts">
import 'leaflet/dist/leaflet.css'
import type * as Leaflet from 'leaflet'
import type { LatLng, LocationMapDoc, LocationMapMarker, LocationMapPage, LocationMapRoad, LocationMapShape, LocationMapText, LocationMapVehicle, LocationMarkerKind, VehicleMarkerKind } from '~/types'
import { DEFAULT_TEXT_COLOR, MARKER_KINDS, markerKindDef, metersPerPixel, newLocalId, newMapPage, pinSvg, ROAD_COLORS, TEXT_COLORS, TILE_SOURCES, VEHICLE_COLORS, VEHICLE_KINDS, vehicleKindDef, vehicleSvg } from '~/utils/locationMap'

definePageMeta({ layout: 'portal' })
usePortalToolGuard('location-map')

const { t } = useI18n()
const { confirmDialog } = useAppDialog()
const localePath = useLocalePath()
const route = useRoute()
const mapId = route.params.id as string

const TOOL_MODES = [
  { id: 'pan', labelKey: 'portal.tools.locationMap.toolPan' },
  { id: 'marker', labelKey: 'portal.tools.locationMap.toolMarker' },
  { id: 'text', labelKey: 'portal.tools.locationMap.toolText' },
  { id: 'road', labelKey: 'portal.tools.locationMap.toolRoad' },
  { id: 'shape', labelKey: 'portal.tools.locationMap.toolShape' },
  { id: 'vehicle', labelKey: 'portal.tools.locationMap.toolVehicle' },
] as const
type ToolMode = typeof TOOL_MODES[number]['id']

const doc = ref<LocationMapDoc | null>(null)

// Back to the list, job-scoped when opened from a job (?job=) or when the map
// itself is linked to one ("Hjálpargögn" on the job page).
const backJob = computed(() =>
  (typeof route.query.job === 'string' && route.query.job) || doc.value?.jobId || '')
const backTo = computed(() =>
  localePath({ path: '/portal/tools/location-map', query: backJob.value ? { job: backJob.value } : {} }))
const notFound = ref(false)
const pageIdx = ref(0)
const page = computed(() => doc.value?.pages[pageIdx.value])

const tool = ref<ToolMode>('pan')
const markerKind = ref<LocationMarkerKind>('set')
const vehicleKind = ref<VehicleMarkerKind>('truck')

// True-scale vehicles need real-world coordinates — image pages have none.
const availableModes = computed(() =>
  page.value?.base === 'image' ? TOOL_MODES.filter(m => m.id !== 'vehicle') : TOOL_MODES)
const roadStyle = reactive({ color: ROAD_COLORS[0]!, width: 4, dashed: false })
const drawing = ref<LatLng[]>([])
const shapeKind = ref<'rect' | 'circle'>('rect')
const shapeStyle = reactive({ color: ROAD_COLORS[0]!, width: 3, fill: true, fillOpacity: 0.25 })
/** First corner/center of an in-progress shape. */
const shapeStart = ref<LatLng | null>(null)
const selected = ref<{ type: 'marker' | 'text' | 'road' | 'vehicle' | 'shape', id: string } | null>(null)
const saveState = ref<'idle' | 'dirty' | 'saving' | 'saved' | 'error'>('idle')
const exporting = ref(false)
const exportError = ref('')

const mapEl = ref<HTMLElement | null>(null)
const textInput = ref<HTMLTextAreaElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
/** True while the file dialog should replace the current page's image. */
let replacingImage = false

const hint = computed(() => {
  if (tool.value === 'marker') return t('portal.tools.locationMap.markerHint')
  if (tool.value === 'text') return t('portal.tools.locationMap.textHint')
  if (tool.value === 'road') return t('portal.tools.locationMap.roadHint')
  if (tool.value === 'shape') return t('portal.tools.locationMap.shapeHint')
  if (tool.value === 'vehicle') return t('portal.tools.locationMap.vehicleHint')
  return ''
})

const selectedItem = computed<LocationMapMarker | LocationMapText | LocationMapRoad | LocationMapVehicle | LocationMapShape | null>(() => {
  const p = page.value
  const sel = selected.value
  if (!p || !sel) return null
  if (sel.type === 'marker') return p.markers.find(m => m.id === sel.id) ?? null
  if (sel.type === 'text') return p.texts.find(x => x.id === sel.id) ?? null
  if (sel.type === 'vehicle') return p.vehicles.find(v => v.id === sel.id) ?? null
  if (sel.type === 'shape') return (p.shapes ?? []).find(x => x.id === sel.id) ?? null
  return p.roads.find(r => r.id === sel.id) ?? null
})

// ── Leaflet (client-only; the /portal route tree is ssr: false) ─────────────

let L: typeof Leaflet | null = null
let map: Leaflet.Map | null = null
let overlayLayers: Leaflet.Layer[] = []
let previewLine: Leaflet.Polyline | null = null
let shapePreview: Leaflet.Layer | null = null
/** Suppress moveend persistence while programmatically setting the view. */
let restoring = false

const esc = (s: string) =>
  s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c]!))

function buildMap() {
  const p = page.value
  if (!L || !p || !mapEl.value) return
  map?.remove()
  map = null
  overlayLayers = []
  previewLine = null
  shapePreview = null

  restoring = true
  if (p.base === 'image') {
    const w = p.imageW || 1000
    const h = p.imageH || 1000
    map = L.map(mapEl.value, { crs: L.CRS.Simple, minZoom: -5, zoomControl: false, doubleClickZoom: false, attributionControl: false })
    L.imageOverlay(p.image!, [[0, 0], [h, w]]).addTo(map)
    // Fresh image pages carry the placeholder view set at creation — fit the
    // whole picture instead; the first moveend persists the real view.
    if (p.zoom === 0 && p.center.lat === h / 2 && p.center.lng === w / 2) {
      map.fitBounds([[0, 0], [h, w]])
    }
    else {
      map.setView([p.center.lat, p.center.lng], p.zoom)
    }
  }
  else {
    const src = TILE_SOURCES[p.base]
    map = L.map(mapEl.value, { zoomControl: false, doubleClickZoom: false })
    L.tileLayer(src.url, { maxZoom: src.maxZoom, attribution: src.attribution, crossOrigin: true }).addTo(map)
    map.setView([p.center.lat, p.center.lng], p.zoom)
  }
  restoring = false

  // Zoom control on the right — the title card owns the top-left corner.
  L.control.zoom({ position: 'topright' }).addTo(map)

  map.on('moveend zoomend', () => {
    const pg = page.value
    if (restoring || !map || !pg) return
    const c = map.getCenter()
    pg.center = { lat: c.lat, lng: c.lng }
    pg.zoom = map.getZoom()
    markDirty()
  })
  map.on('click', (e: Leaflet.LeafletMouseEvent) => onMapClick(e.latlng))
  // Live preview while a shape's second point is pending.
  map.on('mousemove', (e: Leaflet.LeafletMouseEvent) => {
    if (tool.value !== 'shape' || !shapeStart.value || !map) return
    shapePreview?.remove()
    shapePreview = shapeLayer({
      shape: shapeKind.value,
      a: shapeStart.value,
      b: { lat: e.latlng.lat, lng: e.latlng.lng },
      ...shapeStyle,
    }, true).addTo(map)
  })
  // Vehicle footprints are sized in pixels-per-meter — recompute after zooming.
  map.on('zoomend', () => {
    if (!restoring && page.value && page.value.base !== 'image' && page.value.vehicles.length) renderOverlays()
  })
  map.on('dblclick', () => {
    if (tool.value === 'road' && drawing.value.length) {
      drawing.value.pop() // the double-click also fired a plain click
      finishRoad()
    }
  })

  renderOverlays()
}

/** Build a Leaflet layer for a shape (also used for the drawing preview). */
function shapeLayer(sh: Omit<LocationMapShape, 'id'>, preview = false): Leaflet.Layer {
  const opts: Leaflet.PathOptions = {
    color: sh.color,
    weight: sh.width,
    fill: sh.fill,
    fillColor: sh.color,
    fillOpacity: sh.fill ? sh.fillOpacity : 0,
    dashArray: preview ? '6 6' : undefined,
    opacity: preview ? 0.8 : 1,
  }
  if (sh.shape === 'rect') {
    return L!.rectangle([[sh.a.lat, sh.a.lng], [sh.b.lat, sh.b.lng]], opts)
  }
  // Circle: center a, edge at b. map.distance works for both CRS (meters on
  // real maps, pixel units on CRS.Simple image pages) — matching L.circle.
  return L!.circle([sh.a.lat, sh.a.lng], {
    ...opts,
    radius: map!.distance([sh.a.lat, sh.a.lng], [sh.b.lat, sh.b.lng]),
  })
}

function renderOverlays() {
  const p = page.value
  if (!L || !map || !p) return
  for (const layer of overlayLayers) layer.remove()
  overlayLayers = []

  // Shapes go in first so roads, vehicles and pins draw on top of them.
  for (const sh of p.shapes ?? []) {
    const layer = shapeLayer(sh).addTo(map)
    layer.on('click', (e: Leaflet.LeafletMouseEvent) => {
      L!.DomEvent.stopPropagation(e)
      if (tool.value === 'pan') selected.value = { type: 'shape', id: sh.id }
    })
    overlayLayers.push(layer)
  }

  for (const road of p.roads) {
    const line = L.polyline(road.points.map(pt => [pt.lat, pt.lng] as [number, number]), {
      color: road.color,
      weight: road.width,
      dashArray: road.dashed ? '8 6' : undefined,
    }).addTo(map)
    line.on('click', (e: Leaflet.LeafletMouseEvent) => {
      L!.DomEvent.stopPropagation(e)
      if (tool.value === 'pan') selected.value = { type: 'road', id: road.id }
    })
    overlayLayers.push(line)
  }

  for (const tx of p.texts) {
    const icon = L.divIcon({
      className: 'lm-icon',
      html: `<div class="lm-textbox" style="font-size:${tx.size}px;color:${tx.color || DEFAULT_TEXT_COLOR}">${esc(tx.text || '…').replace(/\n/g, '<br>')}</div>`,
      iconSize: undefined as unknown as Leaflet.PointExpression,
      iconAnchor: [0, 0],
    })
    const m = L.marker([tx.lat, tx.lng], { icon, draggable: true }).addTo(map)
    m.on('click', (e: Leaflet.LeafletMouseEvent) => {
      L!.DomEvent.stopPropagation(e)
      selected.value = { type: 'text', id: tx.id }
    })
    m.on('dragend', () => {
      const ll = m.getLatLng()
      tx.lat = ll.lat
      tx.lng = ll.lng
      markDirty()
    })
    overlayLayers.push(m)
  }

  // True-scale vehicles (map pages only): meters -> pixels at the current zoom,
  // so the footprint always matches the map. Re-rendered on zoomend.
  if (p.base !== 'image' && map) {
    const zoom = map.getZoom()
    for (const v of p.vehicles) {
      const mpp = metersPerPixel(v.lat, zoom)
      const lPx = Math.max(v.lengthM / mpp, 4)
      const wPx = Math.max(v.widthM / mpp, 2)
      // Vertical extent of the rotated footprint — puts the label clear of it.
      const rad = (v.rotation * Math.PI) / 180
      const vExt = Math.abs(lPx * Math.sin(rad)) + Math.abs(wPx * Math.cos(rad))
      const icon = L.divIcon({
        className: 'lm-icon',
        html: `<div class="lm-veh" style="transform:rotate(${v.rotation}deg)">${vehicleSvg(v.kind, v.lengthM, v.widthM, v.color)}</div>`
          + (v.label ? `<div class="lm-pin-label" style="top:${Math.round(wPx / 2 + vExt / 2 + 3)}px">${esc(v.label)}</div>` : ''),
        iconSize: [lPx, wPx],
        iconAnchor: [lPx / 2, wPx / 2],
      })
      const m = L.marker([v.lat, v.lng], { icon, draggable: true }).addTo(map)
      m.on('click', (e: Leaflet.LeafletMouseEvent) => {
        L!.DomEvent.stopPropagation(e)
        selected.value = { type: 'vehicle', id: v.id }
      })
      m.on('dragend', () => {
        const ll = m.getLatLng()
        v.lat = ll.lat
        v.lng = ll.lng
        markDirty()
      })
      overlayLayers.push(m)
    }
  }

  for (const mk of p.markers) {
    const def = markerKindDef(mk.kind)
    // Set pins carry a location number: shown inside the pin, and as the
    // chip/index name ("Location N") when no custom label is given.
    const glyph = mk.kind === 'set' && mk.num ? String(mk.num) : def.glyph
    const chip = mk.label || (mk.kind === 'set' && mk.num ? t('portal.tools.locationMap.locationN', { n: mk.num }) : '')
    const icon = L.divIcon({
      className: 'lm-icon',
      html: `<div class="lm-pin2">${pinSvg(def.color, glyph)}</div>`
        + (chip ? `<div class="lm-pin-chip" style="color:${def.color}">${esc(chip)}</div>` : ''),
      iconSize: [30, 40],
      iconAnchor: [15, 39], // pin tip = the spot
    })
    const m = L.marker([mk.lat, mk.lng], { icon, draggable: true }).addTo(map)
    m.on('click', (e: Leaflet.LeafletMouseEvent) => {
      L!.DomEvent.stopPropagation(e)
      selected.value = { type: 'marker', id: mk.id }
    })
    m.on('dragend', () => {
      const ll = m.getLatLng()
      mk.lat = ll.lat
      mk.lng = ll.lng
      markDirty()
    })
    overlayLayers.push(m)
  }

  updatePreview()
}

function updatePreview() {
  if (!L || !map) return
  previewLine?.remove()
  previewLine = null
  if (drawing.value.length) {
    previewLine = L.polyline(drawing.value.map(pt => [pt.lat, pt.lng] as [number, number]), {
      color: roadStyle.color,
      weight: roadStyle.width,
      dashArray: roadStyle.dashed ? '8 6' : '2 8',
      opacity: 0.8,
    }).addTo(map)
  }
}

/** Re-render overlays after editing the selected item's properties. */
function touch() {
  renderOverlays()
  markDirty()
}

// The side panel mounting/unmounting resizes the map container mid-layout;
// Leaflet only watches window resizes, so nudge it or clicks land offset.
watch(() => !!selectedItem.value, () => nextTick(() => map?.invalidateSize()))

// A text box left empty is a ghost — drop it as soon as it's deselected.
watch(selected, (_now, old) => {
  const p = page.value
  if (old?.type !== 'text' || !p) return
  const ghost = p.texts.find(x => x.id === old.id && !x.text.trim())
  if (ghost) {
    p.texts = p.texts.filter(x => x.id !== ghost.id)
    touch()
  }
})

// ── Editing actions ──────────────────────────────────────────────────────────

function onMapClick(ll: Leaflet.LatLng) {
  const p = page.value
  if (!p) return
  if (tool.value === 'marker') {
    const mk: LocationMapMarker = { id: newLocalId('m'), kind: markerKind.value, lat: ll.lat, lng: ll.lng }
    if (mk.kind === 'set') mk.num = nextLocationNum(p)
    p.markers.push(mk)
    selected.value = { type: 'marker', id: mk.id }
    touch()
  }
  else if (tool.value === 'text') {
    const tx: LocationMapText = { id: newLocalId('t'), lat: ll.lat, lng: ll.lng, text: '', size: 14 }
    p.texts.push(tx)
    selected.value = { type: 'text', id: tx.id }
    touch()
    nextTick(() => textInput.value?.focus())
  }
  else if (tool.value === 'road') {
    drawing.value.push({ lat: ll.lat, lng: ll.lng })
    updatePreview()
  }
  else if (tool.value === 'shape') {
    if (!shapeStart.value) {
      shapeStart.value = { lat: ll.lat, lng: ll.lng }
    }
    else {
      const sh: LocationMapShape = {
        id: newLocalId('s'),
        shape: shapeKind.value,
        a: shapeStart.value,
        b: { lat: ll.lat, lng: ll.lng },
        color: shapeStyle.color,
        width: shapeStyle.width,
        fill: shapeStyle.fill,
        fillOpacity: shapeStyle.fillOpacity,
      }
      ;(p.shapes ??= []).push(sh)
      cancelShape()
      selected.value = { type: 'shape', id: sh.id }
      touch()
    }
  }
  else if (tool.value === 'vehicle') {
    if (p.base === 'image') return
    const def = vehicleKindDef(vehicleKind.value)
    const v: LocationMapVehicle = {
      id: newLocalId('v'),
      kind: def.kind,
      lat: ll.lat,
      lng: ll.lng,
      lengthM: def.lengthM,
      widthM: def.widthM,
      rotation: 0,
      color: VEHICLE_COLORS[1]!,
    }
    p.vehicles.push(v)
    selected.value = { type: 'vehicle', id: v.id }
    touch()
  }
  else {
    selected.value = null
  }
}

/** Next free location number on the page (set pins). */
const nextLocationNum = (p: LocationMapPage): number =>
  Math.max(0, ...p.markers.filter(m => m.kind === 'set' && m.num).map(m => m.num!)) + 1

/** Kind switched in the panel: set pins gain a number, others lose it. */
function onMarkerKindChange() {
  const m = selectedItem.value as LocationMapMarker
  if (m.kind === 'set' && !m.num && page.value) m.num = nextLocationNum(page.value)
  else if (m.kind !== 'set') delete m.num
  touch()
}

/** Changing the type in the panel resets the footprint to that type's preset. */
function onVehicleKindChange() {
  const v = selectedItem.value as LocationMapVehicle
  const def = vehicleKindDef(v.kind)
  v.lengthM = def.lengthM
  v.widthM = def.widthM
  touch()
}

function setTool(mode: ToolMode) {
  if (tool.value === 'road' && mode !== 'road') cancelRoad()
  if (tool.value === 'shape' && mode !== 'shape') cancelShape()
  tool.value = mode
  if (mode !== 'pan') selected.value = null
}

function cancelShape() {
  shapeStart.value = null
  shapePreview?.remove()
  shapePreview = null
}

function finishRoad() {
  const p = page.value
  if (!p) return
  if (drawing.value.length >= 2) {
    p.roads.push({
      id: newLocalId('r'),
      points: [...drawing.value],
      color: roadStyle.color,
      width: roadStyle.width,
      dashed: roadStyle.dashed,
    })
    markDirty()
  }
  drawing.value = []
  renderOverlays()
}

function undoRoadPoint() {
  drawing.value.pop()
  updatePreview()
}

function cancelRoad() {
  drawing.value = []
  updatePreview()
}

function deleteSelected() {
  const p = page.value
  const sel = selected.value
  if (!p || !sel) return
  if (sel.type === 'marker') p.markers = p.markers.filter(m => m.id !== sel.id)
  else if (sel.type === 'text') p.texts = p.texts.filter(x => x.id !== sel.id)
  else if (sel.type === 'vehicle') p.vehicles = p.vehicles.filter(v => v.id !== sel.id)
  else if (sel.type === 'shape') p.shapes = (p.shapes ?? []).filter(x => x.id !== sel.id)
  else p.roads = p.roads.filter(r => r.id !== sel.id)
  selected.value = null
  touch()
}

// ── Pages ────────────────────────────────────────────────────────────────────

function switchPage(i: number) {
  if (!doc.value || i === pageIdx.value) return
  selected.value = null
  cancelRoad()
  cancelShape()
  pageIdx.value = i
  // The vehicle tool doesn't exist on image pages.
  if (tool.value === 'vehicle' && page.value?.base === 'image') tool.value = 'pan'
  nextTick(buildMap)
}

function addPage(kind: 'map' | 'image') {
  if (!doc.value) return
  if (kind === 'image') {
    pickImage(false)
    return
  }
  // Reuse the current viewport so the new page starts where the user is.
  const fresh = newMapPage('', page.value?.base === 'satellite' ? 'satellite' : 'streets')
  if (page.value && page.value.base !== 'image') {
    fresh.center = { ...page.value.center }
    fresh.zoom = page.value.zoom
  }
  doc.value.pages.push(fresh)
  markDirty()
  switchPage(doc.value.pages.length - 1)
}

async function deletePage() {
  if (!doc.value || !await confirmDialog(t('portal.tools.locationMap.confirmDeletePage'))) return
  doc.value.pages.splice(pageIdx.value, 1)
  if (!doc.value.pages.length) doc.value.pages.push(newMapPage(''))
  selected.value = null
  cancelRoad()
  cancelShape()
  pageIdx.value = Math.min(pageIdx.value, doc.value.pages.length - 1)
  markDirty()
  nextTick(buildMap)
}

function setBase(base: 'streets' | 'satellite') {
  const p = page.value
  if (!p || p.base === base) return
  p.base = base
  markDirty()
  buildMap()
}

function pickImage(replace: boolean) {
  replacingImage = replace
  if (fileInput.value) fileInput.value.value = ''
  fileInput.value?.click()
}

async function onImagePicked(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || !doc.value) return
  exportError.value = ''
  try {
    const { dataUrl, w, h } = await fileToResizedDataUrl(file)
    if (replacingImage && page.value?.base === 'image') {
      Object.assign(page.value, { image: dataUrl, imageW: w, imageH: h, center: { lat: h / 2, lng: w / 2 }, zoom: 0 })
    }
    else {
      doc.value.pages.push({
        id: newLocalId('p'),
        title: '',
        base: 'image',
        image: dataUrl,
        imageW: w,
        imageH: h,
        center: { lat: h / 2, lng: w / 2 },
        zoom: 0,
        markers: [],
        roads: [],
        texts: [],
        vehicles: [],
      })
      pageIdx.value = doc.value.pages.length - 1
    }
    markDirty()
    nextTick(buildMap)
  }
  catch {
    exportError.value = t('portal.tools.locationMap.imageTooLarge')
  }
}

/** Downscale to ≤2400px and re-encode as JPEG so saved documents stay small. */
async function fileToResizedDataUrl(file: File, maxDim = 2400): Promise<{ dataUrl: string, w: number, h: number }> {
  const bmp = await createImageBitmap(file)
  try {
    const s = Math.min(1, maxDim / Math.max(bmp.width, bmp.height))
    const w = Math.max(1, Math.round(bmp.width * s))
    const h = Math.max(1, Math.round(bmp.height * s))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('no canvas')
    ctx.drawImage(bmp, 0, 0, w, h)
    return { dataUrl: canvas.toDataURL('image/jpeg', 0.85), w, h }
  }
  finally {
    bmp.close()
  }
}

// ── Persistence ──────────────────────────────────────────────────────────────

let saveTimer: ReturnType<typeof setTimeout> | undefined

function markDirty() {
  saveState.value = 'dirty'
  clearTimeout(saveTimer)
  saveTimer = setTimeout(save, 1500)
}

/** Pages as sent to the API: text boxes still being typed (empty) are dropped. */
const cleanPages = () =>
  doc.value!.pages.map(p => ({ ...p, texts: p.texts.filter(x => x.text.trim()) }))

async function save() {
  if (!doc.value) return
  clearTimeout(saveTimer)
  saveState.value = 'saving'
  try {
    await $fetch(`/api/portal/tools/location-maps/${mapId}`, {
      method: 'PATCH',
      body: { name: doc.value.name.trim() || doc.value.name, pages: cleanPages() },
    })
    saveState.value = 'saved'
  }
  catch {
    saveState.value = 'error'
  }
}

async function doExport() {
  if (!doc.value) return
  exporting.value = true
  exportError.value = ''
  try {
    if (saveState.value === 'dirty' || saveState.value === 'error') await save()
    const { exportLocationMapPdf } = await import('~/utils/locationMapPdf')
    const bytes = await exportLocationMapPdf(
      { ...doc.value, pages: cleanPages() },
      {
        locationsTitle: t('portal.tools.locationMap.locations'),
        locationName: n => t('portal.tools.locationMap.locationN', { n }),
        kindName: k => t(markerKindDef(k).labelKey),
      },
    )
    const safeName = doc.value.name.replace(/[\\/:*?"<>|]+/g, ' ').trim() || 'kort'
    downloadBlob(bytes, `${safeName}.pdf`, 'application/pdf')
  }
  catch {
    exportError.value = t('portal.tools.locationMap.exportFailed')
  }
  finally {
    exporting.value = false
  }
}

// ── Lifecycle ────────────────────────────────────────────────────────────────

function onKeydown(e: KeyboardEvent) {
  if ((e.target as HTMLElement | null)?.closest('input, textarea, select')) return
  if (e.key === 'Enter' && tool.value === 'road' && drawing.value.length) {
    e.preventDefault()
    finishRoad()
  }
  else if (e.key === 'Escape') {
    if (drawing.value.length) cancelRoad()
    else if (shapeStart.value) cancelShape()
    else selected.value = null
  }
  else if ((e.key === 'Delete' || e.key === 'Backspace') && selected.value) {
    e.preventDefault()
    deleteSelected()
  }
}

function onBeforeUnload(e: BeforeUnloadEvent) {
  if (saveState.value === 'dirty' || saveState.value === 'saving') e.preventDefault()
}

onMounted(async () => {
  try {
    doc.value = await $fetch<LocationMapDoc>(`/api/portal/tools/location-maps/${mapId}`)
    // Docs saved before vehicles/shapes existed lack those arrays.
    for (const p of doc.value.pages) {
      p.vehicles ??= []
      p.shapes ??= []
    }
  }
  catch {
    notFound.value = true
    return
  }
  try {
    // Vite serves leaflet's UMD build as an ESM default export.
    const mod = await import('leaflet') as typeof Leaflet & { default?: typeof Leaflet }
    L = mod.default ?? mod
  }
  catch {
    // Typically a stale dev-server module cache or being offline.
    exportError.value = t('portal.tools.locationMap.loadFailed')
    return
  }
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('beforeunload', onBeforeUnload)
  nextTick(buildMap)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('beforeunload', onBeforeUnload)
  if (saveState.value === 'dirty') save()
  clearTimeout(saveTimer)
  map?.remove()
  map = null
})

useHead({ title: 'Tökustaðakort · Hjálpartól · Portal' })
</script>

<style>
/* Leaflet divIcons for the location-map editor (global: rendered by Leaflet
   outside Vue's scoped-style reach). */
.lm-icon {
  background: none;
  border: none;
}
.lm-crosshair .leaflet-container {
  cursor: crosshair;
}
.lm-pin2 {
  position: absolute;
  inset: 0;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.55));
}
/* Production-map label chip: uppercase colored text on a dark badge. */
.lm-pin-chip {
  position: absolute;
  top: 42px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(22, 22, 22, 0.78);
  padding: 3px 9px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}
.lm-map-title {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 1000;
  pointer-events: none;
  background: rgba(22, 22, 22, 0.72);
  padding: 10px 18px 12px;
  border-radius: 4px;
}
.lm-map-title-main {
  font-family: Oswald, Inter, sans-serif;
  font-size: 28px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #f2e18c;
  line-height: 1.1;
}
.lm-map-title-sub {
  font-family: Oswald, Inter, sans-serif;
  font-size: 15px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: #f5f2e9;
  margin-top: 2px;
}
.lm-pin-label {
  position: absolute;
  top: 30px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  font-size: 12px;
  font-weight: 600;
  color: #111;
  text-shadow:
    0 0 3px #fff,
    0 0 3px #fff,
    0 0 3px #fff;
}
.lm-veh {
  position: absolute;
  inset: 0;
  transform-origin: center;
}
.lm-veh svg {
  overflow: visible;
}
.lm-textbox {
  display: inline-block;
  max-width: 380px;
  padding: 5px 10px;
  background: rgba(22, 22, 22, 0.78);
  border-radius: 3px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  line-height: 1.4;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}
</style>
