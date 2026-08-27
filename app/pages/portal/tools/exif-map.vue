<template>
  <div>
    <NuxtLink
      :to="queryJobId ? localePath(`/portal/jobs/${queryJobId}`) : localePath('/portal/jobs')"
      class="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-bone-500 hover:text-gold-400 transition-colors"
    >
      ← {{ queryJobId ? $t('portal.tools.backToJob') : $t('portal.nav.jobs') }}
    </NuxtLink>
    <h1 class="mt-3 text-3xl font-semibold uppercase tracking-wide text-bone-100">{{ $t('portal.tools.exifMap.title') }}</h1>
    <p class="mt-2 max-w-2xl text-sm text-bone-400">{{ $t('portal.tools.exifMap.long') }}</p>

    <div class="mt-8 max-w-2xl">
      <!-- model-value stays [] so the Dropzone never renders its own file list;
           we keep our richer list (thumb + coords + selection) below instead. -->
      <PortalToolsDropzone
        :model-value="[]"
        accept=".jpg,.jpeg,image/jpeg"
        multiple
        :hint="$t('portal.tools.exifMap.hint')"
        @update:model-value="addFiles"
      />
    </div>

    <p v-if="error" class="mt-3 text-sm text-signal-500">{{ error }}</p>

    <template v-if="items.length">
      <!-- Toolbar -->
      <div class="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 border border-ink-800 bg-ink-900/50 p-3">
        <div class="flex gap-1.5">
          <button
            v-for="b in (['streets', 'satellite'] as const)"
            :key="b"
            type="button"
            class="px-2.5 py-1 text-xs border transition-colors"
            :class="base === b ? 'border-gold-500/60 text-gold-400' : 'border-ink-800 text-bone-500 hover:text-bone-300'"
            @click="setBase(b)"
          >
            {{ $t(b === 'streets' ? 'portal.tools.locationMap.baseStreets' : 'portal.tools.locationMap.baseSatellite') }}
          </button>
        </div>
        <p class="text-xs text-bone-500">{{ $t('portal.tools.exifMap.clickHint') }}</p>
        <div class="ml-auto flex items-center gap-3">
          <button
            v-if="items.length > 1 && selectedItem && selectedItem.lat != null"
            type="button"
            class="btn-ghost !px-4 !py-2 !text-xs"
            @click="applyToAll"
          >
            {{ $t('portal.tools.exifMap.applyAll') }}
          </button>
          <button
            type="button"
            class="btn-gold disabled:opacity-50"
            :disabled="!taggedCount || busy"
            @click="downloadAll"
          >
            {{ busy ? $t('portal.tools.exifMap.working') : $t('portal.tools.exifMap.downloadAll') }} ({{ taggedCount }})
          </button>
        </div>
      </div>

      <!-- Photo list + map -->
      <div class="mt-3 flex flex-col gap-3 lg:flex-row">
        <div class="shrink-0 lg:w-80">
          <ul class="border border-ink-800 divide-y divide-ink-800 lg:max-h-[65vh] overflow-y-auto">
            <li
              v-for="(it, i) in items"
              :key="it.id"
              class="flex cursor-pointer items-center gap-3 p-3 transition-colors"
              :class="selectedId === it.id ? 'bg-gold-500/10' : 'bg-ink-900/50 hover:bg-ink-900'"
              @click="select(it.id)"
            >
              <span class="w-5 shrink-0 text-xs text-bone-500">{{ i + 1 }}</span>
              <img :src="it.url" :alt="it.name" class="h-12 w-12 shrink-0 border border-ink-700 object-cover">
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm text-bone-100">{{ it.name }}</p>
                <p class="text-xs" :class="it.lat != null ? 'text-gold-400' : 'text-bone-500'">
                  {{ it.lat != null ? `${it.lat.toFixed(5)}, ${it.lng!.toFixed(5)}` : $t('portal.tools.exifMap.noLocation') }}
                </p>
              </div>
              <button
                v-if="it.lat != null"
                type="button"
                class="shrink-0 px-1.5 text-xs uppercase tracking-widest text-bone-400 hover:text-gold-400"
                :title="$t('portal.tools.exifMap.download')"
                @click.stop="downloadOne(it)"
              >↓</button>
              <button
                type="button"
                class="shrink-0 px-1.5 text-bone-500 hover:text-signal-500"
                :aria-label="$t('portal.tools.remove')"
                @click.stop="removeItem(it.id)"
              >✕</button>
            </li>
          </ul>
          <button
            type="button"
            class="mt-3 text-xs uppercase tracking-widest text-bone-500 hover:text-signal-500 transition-colors"
            @click="clearAll"
          >
            {{ $t('portal.tools.clearAll') }}
          </button>
        </div>

        <div class="min-w-0 flex-1 xm-crosshair">
          <div ref="mapEl" class="h-[65vh] w-full border border-ink-800 bg-ink-950" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
// Geotag JPGs entirely in the browser: piexifjs (vendored UMD at
// /vendor/piexif.js, attaches window.piexif) reads and writes the EXIF GPS
// block; Leaflet provides the picker map. No photo ever leaves the device.
import 'leaflet/dist/leaflet.css'
import type * as Leaflet from 'leaflet'
import { TILE_SOURCES } from '~/utils/locationMap'

type ExifSection = Record<number, unknown>
interface ExifObj {
  '0th': ExifSection
  'Exif': ExifSection
  'GPS': ExifSection
  '1st': ExifSection
  'thumbnail': string | null
}
interface Piexif {
  load: (data: string) => ExifObj
  dump: (exifObj: ExifObj) => string
  insert: (exifStr: string, data: string) => string
  GPSIFD: { GPSVersionID: number, GPSLatitudeRef: number, GPSLatitude: number, GPSLongitudeRef: number, GPSLongitude: number }
  GPSHelper: {
    degToDmsRational: (deg: number) => [number, number][]
    dmsRationalToDeg: (dms: [number, number][], ref: string) => number
  }
}
declare global {
  interface Window { piexif?: Piexif }
}

definePageMeta({ layout: 'portal' })
usePortalToolGuard('exif-map')

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
// Opened from a job page (?job=) → the back link returns there.
const queryJobId = computed(() => (typeof route.query.job === 'string' ? route.query.job : ''))

interface Item {
  id: string
  file: File
  name: string
  /** Object URL for the list thumbnail. */
  url: string
  lat: number | null
  lng: number | null
}

const items = ref<Item[]>([])
const selectedId = ref<string | null>(null)
const base = ref<'streets' | 'satellite'>('streets')
const busy = ref(false)
const error = ref('')
const mapEl = ref<HTMLElement | null>(null)

const selectedItem = computed(() => items.value.find(it => it.id === selectedId.value) ?? null)
const taggedCount = computed(() => items.value.filter(it => it.lat != null).length)

const newId = () => `x-${Math.random().toString(36).slice(2, 10)}`

// ── EXIF helpers ─────────────────────────────────────────────────────────────

async function getPiexif(): Promise<Piexif> {
  await loadScript('/vendor/piexif.js')
  const piexif = window.piexif
  if (!piexif) throw new Error('piexif unavailable')
  return piexif
}

/** piexifjs works on JS binary strings (one char per byte). */
async function fileToBinaryString(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let s = ''
  const CHUNK = 0x8000
  for (let i = 0; i < bytes.length; i += CHUNK) {
    s += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return s
}

function binaryStringToBytes(s: string): Uint8Array {
  const out = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 0xff
  return out
}

/** Write the item's lat/lng into the file's EXIF GPS block, keeping the rest. */
async function geotagBytes(piexif: Piexif, it: Item): Promise<Uint8Array> {
  const data = await fileToBinaryString(it.file)
  let exifObj: ExifObj
  try {
    exifObj = piexif.load(data)
  }
  catch {
    // Valid JPEG without a parseable EXIF block: start from an empty one.
    exifObj = { '0th': {}, 'Exif': {}, 'GPS': {}, '1st': {}, 'thumbnail': null }
  }
  const g = piexif.GPSIFD
  exifObj.GPS[g.GPSVersionID] = [2, 3, 0, 0]
  exifObj.GPS[g.GPSLatitudeRef] = it.lat! >= 0 ? 'N' : 'S'
  exifObj.GPS[g.GPSLatitude] = piexif.GPSHelper.degToDmsRational(Math.abs(it.lat!))
  exifObj.GPS[g.GPSLongitudeRef] = it.lng! >= 0 ? 'E' : 'W'
  exifObj.GPS[g.GPSLongitude] = piexif.GPSHelper.degToDmsRational(Math.abs(it.lng!))
  return binaryStringToBytes(piexif.insert(piexif.dump(exifObj), data))
}

// ── File handling ────────────────────────────────────────────────────────────

async function addFiles(files: File[]) {
  if (!files.length) return
  error.value = ''
  const fresh: Item[] = files.map(f => ({
    id: newId(),
    file: f,
    name: f.name,
    url: URL.createObjectURL(f),
    lat: null,
    lng: null,
  }))
  items.value.push(...fresh)

  await nextTick()
  await ensureMap()

  // Read any GPS position the photos already carry.
  try {
    const piexif = await getPiexif()
    for (const it of fresh) {
      try {
        const exif = piexif.load(await fileToBinaryString(it.file))
        const latDms = exif.GPS[piexif.GPSIFD.GPSLatitude] as [number, number][] | undefined
        const lngDms = exif.GPS[piexif.GPSIFD.GPSLongitude] as [number, number][] | undefined
        if (latDms && lngDms) {
          it.lat = piexif.GPSHelper.dmsRationalToDeg(latDms, (exif.GPS[piexif.GPSIFD.GPSLatitudeRef] as string) || 'N')
          it.lng = piexif.GPSHelper.dmsRationalToDeg(lngDms, (exif.GPS[piexif.GPSIFD.GPSLongitudeRef] as string) || 'E')
        }
      }
      catch {
        // Unreadable EXIF: the photo simply starts without a position.
      }
    }
  }
  catch {
    error.value = t('portal.tools.exifMap.loadFailed')
  }

  if (!selectedId.value) {
    selectedId.value = (fresh.find(it => it.lat == null) ?? fresh[0]!).id
  }
  renderMarkers()
  fitTo(fresh.filter(it => it.lat != null))
}

function select(id: string) {
  selectedId.value = id
  const it = items.value.find(x => x.id === id)
  if (it && it.lat != null && map) map.panTo([it.lat, it.lng!])
  renderMarkers()
}

function removeItem(id: string) {
  const it = items.value.find(x => x.id === id)
  if (it) URL.revokeObjectURL(it.url)
  items.value = items.value.filter(x => x.id !== id)
  if (selectedId.value === id) selectedId.value = null
  renderMarkers()
}

function clearAll() {
  items.value.forEach(it => URL.revokeObjectURL(it.url))
  items.value = []
  selectedId.value = null
}

function applyToAll() {
  const src = selectedItem.value
  if (!src || src.lat == null) return
  for (const it of items.value) {
    it.lat = src.lat
    it.lng = src.lng
  }
  renderMarkers()
}

// ── Download ─────────────────────────────────────────────────────────────────

async function downloadOne(it: Item) {
  error.value = ''
  try {
    const piexif = await getPiexif()
    downloadBlob(await geotagBytes(piexif, it), it.name, 'image/jpeg')
  }
  catch {
    error.value = t('portal.tools.exifMap.failed', { name: it.name })
  }
}

async function downloadAll() {
  busy.value = true
  error.value = ''
  try {
    const piexif = await getPiexif()
    for (const it of items.value.filter(x => x.lat != null)) {
      try {
        downloadBlob(await geotagBytes(piexif, it), it.name, 'image/jpeg')
      }
      catch {
        error.value = t('portal.tools.exifMap.failed', { name: it.name })
      }
    }
  }
  catch {
    error.value = t('portal.tools.exifMap.loadFailed')
  }
  finally {
    busy.value = false
  }
}

// ── Leaflet (client-only; the /portal route tree is ssr: false) ─────────────

let L: typeof Leaflet | null = null
let map: Leaflet.Map | null = null
let tiles: Leaflet.TileLayer | null = null
let markerLayers: Leaflet.Marker[] = []
let mapInit: Promise<void> | null = null

function ensureMap(): Promise<void> {
  mapInit ??= (async () => {
    if (!L) {
      // Vite serves leaflet's UMD build as an ESM default export.
      const mod = await import('leaflet') as typeof Leaflet & { default?: typeof Leaflet }
      L = mod.default ?? mod
    }
    if (!mapEl.value) return
    map = L.map(mapEl.value, { zoomControl: true, doubleClickZoom: false })
    setTiles()
    // Reykjavík until the photos say otherwise.
    map.setView([64.1466, -21.9426], 11)
    map.on('click', (e: Leaflet.LeafletMouseEvent) => onMapClick(e.latlng))
  })()
  return mapInit
}

function setTiles() {
  if (!L || !map) return
  const src = TILE_SOURCES[base.value]
  tiles?.remove()
  tiles = L.tileLayer(src.url, { maxZoom: src.maxZoom, attribution: src.attribution, crossOrigin: true }).addTo(map)
}

function setBase(b: 'streets' | 'satellite') {
  if (base.value === b) return
  base.value = b
  setTiles()
}

function onMapClick(ll: Leaflet.LatLng) {
  // Place on the selected photo, or the first one still without a position.
  const it = selectedItem.value ?? items.value.find(x => x.lat == null)
  if (!it) return
  it.lat = ll.lat
  it.lng = ll.lng
  // Auto-advance to the next untagged photo so bulk tagging is click-click-click.
  const idx = items.value.indexOf(it)
  const next = [...items.value.slice(idx + 1), ...items.value.slice(0, idx)].find(x => x.lat == null)
  selectedId.value = (next ?? it).id
  renderMarkers()
}

function renderMarkers() {
  if (!L || !map) return
  for (const m of markerLayers) m.remove()
  markerLayers = []
  items.value.forEach((it, i) => {
    if (it.lat == null || it.lng == null) return
    const sel = it.id === selectedId.value
    const icon = L!.divIcon({
      className: 'xm-icon',
      html: `<div class="xm-pin${sel ? ' xm-pin-sel' : ''}">${i + 1}</div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    })
    const m = L!.marker([it.lat, it.lng], { icon, draggable: true }).addTo(map!)
    m.on('click', (e: Leaflet.LeafletMouseEvent) => {
      L!.DomEvent.stopPropagation(e)
      selectedId.value = it.id
      renderMarkers()
    })
    m.on('dragend', () => {
      const ll = m.getLatLng()
      it.lat = ll.lat
      it.lng = ll.lng
    })
    markerLayers.push(m)
  })
}

function fitTo(tagged: Item[]) {
  if (!L || !map || !tagged.length) return
  map.fitBounds(
    L.latLngBounds(tagged.map(it => [it.lat!, it.lng!] as [number, number])),
    { maxZoom: 15, padding: [40, 40] },
  )
}

// Empty list unmounts the map element (v-if); tear Leaflet down with it.
watch(() => items.value.length > 0, (has) => {
  if (!has) {
    map?.remove()
    map = null
    tiles = null
    markerLayers = []
    mapInit = null
  }
})

onBeforeUnmount(() => {
  items.value.forEach(it => URL.revokeObjectURL(it.url))
  map?.remove()
  map = null
})

useHead({ title: 'EXIF staðsetning · Hjálpartól · Portal' })
</script>

<style>
/* Leaflet divIcons for the EXIF geotag tool (global: rendered by Leaflet
   outside Vue's scoped-style reach). */
.xm-icon {
  background: none;
  border: none;
}
.xm-crosshair .leaflet-container {
  cursor: crosshair;
}
.xm-pin {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2.5px solid #fff;
  background: #2563eb;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
  color: #fff;
  font-weight: 700;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
.xm-pin-sel {
  background: #d97706;
  transform: scale(1.18);
}
</style>
