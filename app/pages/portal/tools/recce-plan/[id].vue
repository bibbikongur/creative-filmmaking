<template>
  <div class="max-w-5xl">
    <NuxtLink
      :to="backTo"
      class="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-bone-500 hover:text-gold-400 transition-colors"
    >
      ← {{ $t('portal.tools.recce.backToList') }}
    </NuxtLink>

    <p v-if="notFound" class="mt-8 text-sm text-bone-500">{{ $t('portal.tools.recce.notFound') }}</p>

    <template v-else-if="doc">
      <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-3xl font-semibold uppercase tracking-wide text-bone-100">{{ name || $t('portal.tools.recce.title') }}</h1>
        <p class="text-xs uppercase tracking-widest" :class="saveState === 'error' ? 'text-signal-500' : 'text-bone-500'">
          {{ saveState === 'saving' ? $t('portal.tools.recce.saving')
            : saveState === 'error' ? $t('portal.tools.recce.saveFailed')
              : $t('portal.tools.recce.saved') }}
        </p>
      </div>

      <!-- Basics -->
      <div class="mt-6 border border-ink-800 bg-ink-900/50 p-5">
        <p class="text-xs uppercase tracking-widest text-bone-500">{{ $t('portal.tools.recce.basics') }}</p>
        <div class="mt-3 grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="text-[10px] uppercase tracking-widest text-bone-500">{{ $t('portal.tools.recce.project') }}</span>
            <input v-model="name" type="text" class="input-dark mt-1" :placeholder="$t('portal.tools.recce.projectPlaceholder')" maxlength="120">
          </label>
          <div class="grid grid-cols-3 gap-3">
            <label class="block">
              <span class="text-[10px] uppercase tracking-widest text-bone-500">{{ $t('portal.tools.recce.subtitle') }}</span>
              <input v-model="plan.subtitle" type="text" class="input-dark mt-1" :placeholder="$t('portal.tools.recce.subtitlePlaceholder')" maxlength="60">
            </label>
            <label class="block">
              <span class="text-[10px] uppercase tracking-widest text-bone-500">{{ $t('portal.tools.recce.date') }}</span>
              <input v-model="plan.date" type="date" class="input-dark mt-1">
            </label>
            <label class="block">
              <span class="text-[10px] uppercase tracking-widest text-bone-500">{{ $t('portal.tools.recce.startTime') }}</span>
              <input v-model="plan.startTime" type="time" class="input-dark mt-1">
            </label>
          </div>
          <label class="block sm:col-span-2">
            <span class="text-[10px] uppercase tracking-widest text-bone-500">{{ $t('portal.tools.recce.note') }}</span>
            <textarea v-model="plan.note" rows="2" class="input-dark mt-1" :placeholder="$t('portal.tools.recce.notePlaceholder')" maxlength="1000" />
          </label>
        </div>
      </div>

      <!-- Shift everything -->
      <div class="mt-6 flex flex-wrap items-center gap-3">
        <p class="text-xs uppercase tracking-widest text-bone-500">{{ $t('portal.tools.recce.shiftAll') }}</p>
        <div class="flex gap-1.5">
          <button
            v-for="m in SHIFTS"
            :key="m"
            type="button"
            class="border border-ink-700 px-2.5 py-1.5 text-xs text-bone-300 hover:border-gold-500 hover:text-gold-400 transition-colors disabled:opacity-30"
            :disabled="!plan.startTime"
            @click="shiftAll(m)"
          >{{ m > 0 ? '+' : '−' }}{{ formatDuration(Math.abs(m)) }}</button>
        </div>
      </div>

      <!-- Stops -->
      <p class="mt-6 text-xs uppercase tracking-widest text-bone-500">{{ $t('portal.tools.recce.stops') }}</p>

      <div class="mt-3">
        <template v-for="(s, i) in plan.stops" :key="i">
          <div class="border border-ink-800 bg-ink-900/50 p-4">
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-baseline gap-3">
                <p class="text-[10px] uppercase tracking-widest text-gold-500 font-semibold">{{ $t('portal.tools.recce.stop', { n: i + 1 }) }}</p>
                <p v-if="times[i]?.arrive" class="text-sm font-semibold text-bone-100">
                  {{ times[i]!.arrive }}<span v-if="times[i]!.depart" class="text-bone-400"> – {{ times[i]!.depart }}</span>
                </p>
              </div>
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  class="px-1.5 text-bone-600 hover:text-bone-200 transition-colors disabled:opacity-30"
                  :disabled="i === 0"
                  :title="$t('portal.tools.moveUp')"
                  @click="moveStop(i, -1)"
                >↑</button>
                <button
                  type="button"
                  class="px-1.5 text-bone-600 hover:text-bone-200 transition-colors disabled:opacity-30"
                  :disabled="i === plan.stops.length - 1"
                  :title="$t('portal.tools.moveDown')"
                  @click="moveStop(i, 1)"
                >↓</button>
                <button
                  type="button"
                  class="ml-2 text-bone-600 hover:text-signal-500 transition-colors"
                  :title="$t('portal.tools.remove')"
                  @click="plan.stops.splice(i, 1)"
                >
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                  </svg>
                </button>
              </div>
            </div>
            <div class="mt-3 grid gap-3 sm:grid-cols-6">
              <label class="block">
                <span class="text-[10px] uppercase tracking-widest text-bone-500">{{ $t('portal.tools.recce.duration') }}</span>
                <input v-model.number="s.durationMin" type="number" min="0" step="5" class="input-dark mt-1">
              </label>
              <label class="block sm:col-span-5">
                <span class="text-[10px] uppercase tracking-widest text-bone-500">{{ $t('portal.tools.recce.stopName') }}</span>
                <input v-model="s.name" type="text" class="input-dark mt-1" :placeholder="$t('portal.tools.recce.stopNamePlaceholder')" maxlength="160">
              </label>
              <label class="block sm:col-span-3">
                <span class="text-[10px] uppercase tracking-widest text-bone-500">{{ $t('portal.tools.recce.address') }}</span>
                <input v-model="s.address" type="text" class="input-dark mt-1" :placeholder="$t('portal.tools.recce.addressPlaceholder')" maxlength="200">
              </label>
              <label class="block sm:col-span-3">
                <span class="text-[10px] uppercase tracking-widest text-bone-500">{{ $t('portal.tools.recce.mapLinkField') }}</span>
                <input
                  v-model="s.link"
                  type="url"
                  class="input-dark mt-1"
                  :placeholder="$t('portal.tools.recce.mapLinkPlaceholder')"
                  maxlength="500"
                  @change="onLinkChange(s)"
                  @paste="onLinkPaste(s)"
                >
              </label>
              <label class="block sm:col-span-2">
                <span class="text-[10px] uppercase tracking-widest text-bone-500">
                  {{ $t('portal.tools.recce.coords') }}
                  <span v-if="parseCoords(s)" class="text-emerald-400">✓</span>
                </span>
                <input
                  v-model="s.coords"
                  type="text"
                  class="input-dark mt-1"
                  :placeholder="$t('portal.tools.recce.coordsPlaceholder')"
                  maxlength="60"
                  @input="s.coordsAuto = false"
                >
              </label>
              <div class="sm:col-span-4">
                <span class="text-[10px] uppercase tracking-widest text-bone-500">{{ $t('portal.tools.recce.photos') }}</span>
                <div class="mt-1 flex items-center gap-2">
                  <div v-for="(p, pi) in s.photos" :key="pi" class="relative">
                    <img :src="p" class="h-14 w-20 border border-ink-700 object-cover" alt="">
                    <button
                      type="button"
                      class="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-ink-700 bg-ink-900 text-xs text-bone-400 hover:text-signal-500"
                      :title="$t('portal.tools.remove')"
                      @click="s.photos.splice(pi, 1)"
                    >×</button>
                  </div>
                  <label
                    v-if="s.photos.length < 2"
                    class="flex h-14 w-20 cursor-pointer items-center justify-center border border-dashed border-ink-700 text-lg text-bone-500 transition-colors hover:border-gold-500 hover:text-gold-400"
                  >
                    +
                    <input type="file" accept="image/jpeg,image/png,image/webp" class="hidden" multiple @change="addPhotos(s, $event)">
                  </label>
                  <button
                    v-if="s.photos.length < 2"
                    type="button"
                    class="flex h-14 items-center justify-center border border-dashed border-ink-700 px-3 text-center text-[10px] uppercase tracking-widest text-bone-500 transition-colors hover:border-gold-500 hover:text-gold-400"
                    @click="openPicker(s)"
                  >{{ $t('portal.tools.recce.pickFromAlbums') }}</button>
                </div>
              </div>
              <label class="block sm:col-span-6">
                <span class="text-[10px] uppercase tracking-widest text-bone-500">{{ $t('portal.tools.recce.stopNotes') }}</span>
                <textarea v-model="s.notes" rows="2" class="input-dark mt-1" :placeholder="$t('portal.tools.recce.stopNotesPlaceholder')" maxlength="1000" />
              </label>
            </div>
          </div>

          <!-- Drive-time connector to the next stop -->
          <div v-if="i < plan.stops.length - 1" class="flex items-center gap-2.5 py-2 pl-5 text-xs text-bone-500">
            <span class="text-bone-600">↓</span>
            <span class="uppercase tracking-widest">{{ $t('portal.tools.recce.travel') }}</span>
            <input v-model.number="s.travelMin" type="number" min="0" step="5" class="input-dark !w-20 !px-2.5 !py-1.5">
            <span>{{ $t('portal.tools.recce.minShort') }}</span>
          </div>
        </template>
      </div>

      <button
        type="button"
        class="mt-3 border border-ink-700 px-4 py-2 text-xs uppercase tracking-widest text-bone-300 hover:border-gold-500 hover:text-gold-400 transition-colors"
        @click="plan.stops.push(emptyStop())"
      >+ {{ $t('portal.tools.recce.addStop') }}</button>

      <!-- Contacts -->
      <div class="mt-8 border border-ink-800 bg-ink-900/50 p-5">
        <p class="text-xs uppercase tracking-widest text-bone-500">{{ $t('portal.tools.recce.contacts') }}</p>
        <div v-for="(c, i) in plan.contacts" :key="i" class="mt-3 flex items-start gap-3">
          <div class="grid flex-1 gap-3 sm:grid-cols-3">
            <input v-model="c.name" type="text" class="input-dark" :placeholder="$t('portal.tools.recce.contactName')" maxlength="120">
            <input v-model="c.role" type="text" class="input-dark" :placeholder="$t('portal.tools.recce.contactRole')" maxlength="120">
            <input v-model="c.phone" type="text" class="input-dark" :placeholder="$t('portal.tools.recce.contactPhone')" maxlength="40">
          </div>
          <button
            type="button"
            class="mt-3 text-bone-600 hover:text-signal-500 transition-colors"
            :title="$t('portal.tools.remove')"
            @click="plan.contacts.splice(i, 1)"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
            </svg>
          </button>
        </div>
        <button
          type="button"
          class="mt-3 border border-ink-700 px-4 py-2 text-xs uppercase tracking-widest text-bone-300 hover:border-gold-500 hover:text-gold-400 transition-colors"
          @click="plan.contacts.push(emptyContact())"
        >+ {{ $t('portal.tools.recce.addContact') }}</button>
      </div>

      <p v-if="error" class="mt-4 text-sm text-signal-500">{{ error }}</p>
      <p v-if="notice" class="mt-4 text-sm text-gold-400">{{ notice }}</p>

      <div class="mt-6 flex flex-wrap items-center gap-4">
        <button type="button" class="btn-gold disabled:opacity-50" :disabled="busy" @click="exportPdf">
          {{ busy ? $t('portal.tools.working') : $t('portal.tools.recce.export') }}
        </button>
      </div>

      <!-- Location-photo picker -->
      <div
        v-if="picker"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        @click.self="closePicker"
      >
        <div class="flex max-h-[80vh] w-full max-w-3xl flex-col border border-ink-700 bg-ink-950 p-5">
          <div class="flex items-center justify-between gap-3">
            <p class="text-xs uppercase tracking-widest text-bone-400">{{ $t('portal.tools.recce.pickerTitle') }}</p>
            <button type="button" class="px-1 text-bone-500 hover:text-bone-200 transition-colors" @click="closePicker">✕</button>
          </div>

          <div class="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-bone-500">
            <button type="button" class="hover:text-gold-400 transition-colors" @click="openAlbum(null)">{{ $t('portal.tools.recce.pickerRoot') }}</button>
            <template v-if="pickerAlbum">
              <template v-for="b in pickerAlbum.breadcrumb" :key="b.id">
                <span>/</span>
                <button type="button" class="hover:text-gold-400 transition-colors" @click="openAlbum(b.id)">{{ b.name }}</button>
              </template>
              <span>/</span>
              <span class="text-bone-300">{{ pickerAlbum.name }}</span>
            </template>
          </div>

          <div class="mt-3 min-h-40 flex-1 overflow-y-auto">
            <p v-if="pickerLoading" class="text-sm text-bone-500">{{ $t('portal.tools.working') }}</p>
            <p v-else-if="pickerError" class="text-sm text-signal-500">{{ pickerError }}</p>
            <template v-else>
              <div v-if="pickerFolders.length" class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <button
                  v-for="f in pickerFolders"
                  :key="f.id"
                  type="button"
                  class="border border-ink-800 bg-ink-900/50 p-3 text-left transition-colors hover:border-gold-500"
                  @click="openAlbum(f.id)"
                >
                  <p class="truncate text-sm font-semibold text-bone-100">{{ f.name }}</p>
                  <p class="mt-0.5 text-xs text-bone-500">
                    {{ $t('portal.tools.locationPhotos.photoCount', { n: f.photoCount }, f.photoCount) }}<template v-if="f.childCount"> · {{ f.childCount }} 📁</template>
                  </p>
                </button>
              </div>
              <div v-if="pickerAlbum?.photos.length" class="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                <button
                  v-for="p in pickerAlbum.photos"
                  :key="p.id"
                  type="button"
                  class="aspect-square overflow-hidden border border-ink-700 transition-colors hover:border-gold-500 disabled:opacity-50"
                  :disabled="pickerBusy"
                  @click="pickPhoto(p)"
                >
                  <img :src="thumbUrl(p)" class="h-full w-full object-cover" loading="lazy" alt="">
                </button>
              </div>
              <p
                v-if="!pickerFolders.length && !pickerAlbum?.photos.length"
                class="text-sm text-bone-500"
              >{{ $t('portal.tools.recce.pickerEmpty') }}</p>
            </template>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { LocationAlbumDetail, LocationAlbumSummary, LocationPhoto, ReccePlanContact, ReccePlanData, ReccePlanDoc, ReccePlanStop } from '~/types'

definePageMeta({ layout: 'portal' })
usePortalToolGuard('recce-plan')

const { t, locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

// The schedule is duration-driven: one start time, then each stop's dwell time
// plus the drive to the next stop. Every arrival/departure is derived from
// that chain, so stretching one stop (or shifting the start) moves everything
// after it automatically.

const SHIFTS = [-60, -30, -15, 15, 30, 60]

const emptyStop = (): ReccePlanStop => ({ name: '', address: '', notes: '', link: '', coords: '', photos: [], durationMin: 60, travelMin: 30 })
const emptyContact = (): ReccePlanContact => ({ name: '', role: '', phone: '' })

const doc = ref<ReccePlanDoc | null>(null)

// Back to the list, job-scoped when opened from a job (?job=) or when the plan
// itself is linked to one ("Hjálpargögn" on the job page).
const backJob = computed(() =>
  (typeof route.query.job === 'string' && route.query.job) || doc.value?.jobId || '')
const backTo = computed(() =>
  localePath({ path: '/portal/tools/recce-plan', query: backJob.value ? { job: backJob.value } : {} }))
const notFound = ref(false)
const name = ref('')
const plan = reactive<ReccePlanData>({ subtitle: '', date: '', startTime: '', note: '', stops: [], contacts: [] })
const busy = ref(false)
const error = ref('')
const notice = ref('')
const saveState = ref<'saved' | 'saving' | 'error'>('saved')

// Autosave is armed only after the plan has loaded, so the initial fill-in
// doesn't fire a pointless PATCH.
let ready = false
onMounted(async () => {
  try {
    const d = await $fetch<ReccePlanDoc>(`/api/portal/tools/recce-plans/${route.params.id}`)
    doc.value = d
    name.value = d.name
    Object.assign(plan, d.data)
    for (const s of plan.stops) {
      s.coords ??= ''
      s.photos ??= []
    }
    await nextTick()
    ready = true
  }
  catch {
    notFound.value = true
  }
})

let saveTimer: ReturnType<typeof setTimeout> | undefined
const save = async () => {
  saveState.value = 'saving'
  try {
    await $fetch(`/api/portal/tools/recce-plans/${route.params.id}`, {
      method: 'PATCH',
      body: { name: name.value.trim() || t('portal.tools.recce.title'), data: plan },
    })
    saveState.value = 'saved'
  }
  catch {
    saveState.value = 'error'
  }
}
watch([plan, name], () => {
  if (!ready) return
  saveState.value = 'saving'
  clearTimeout(saveTimer)
  saveTimer = setTimeout(save, 1500)
}, { deep: true })

const parseHM = (s: string): number | null => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s)
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}
const formatHM = (min: number): string => {
  const m = ((Math.round(min) % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}
/** "45 mín", "1 klst", "1 klst 30 mín" (localized units). */
const formatDuration = (min: number): string => {
  const h = Math.floor(min / 60)
  const m = min % 60
  const parts: string[] = []
  if (h) parts.push(`${h} ${t('portal.tools.recce.hourShort')}`)
  if (m || !h) parts.push(`${m} ${t('portal.tools.recce.minShort')}`)
  return parts.join(' ')
}

/** Derived arrival/departure per stop, chained from the start time. */
const times = computed(() => {
  let cursor = parseHM(plan.startTime)
  return plan.stops.map((s) => {
    if (cursor === null) return { arrive: '', depart: '' }
    const arrive = cursor
    const depart = arrive + Math.max(0, s.durationMin || 0)
    cursor = depart + Math.max(0, s.travelMin || 0)
    return { arrive: formatHM(arrive), depart: depart > arrive ? formatHM(depart) : '' }
  })
})

const shiftAll = (min: number) => {
  const start = parseHM(plan.startTime)
  if (start !== null) plan.startTime = formatHM(start + min)
}

/**
 * Coordinates from the "lat, lng" field (as copied out of Google Maps), or
 * extracted from the pasted maps link as a fallback.
 */
const parseCoords = (s: ReccePlanStop): { lat: number, lng: number } | null => {
  const m = /^\s*(-?\d{1,2}(?:\.\d+)?)[,\s]+(-?\d{1,3}(?:\.\d+)?)\s*$/.exec(s.coords)
  if (m) {
    const lat = Number(m[1])
    const lng = Number(m[2])
    return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null
  }
  return s.link ? extractCoordsFromMapsUrl(s.link) : null
}

/**
 * When a maps link lands in the field, fill the coords box from it. Full URLs
 * are parsed right here; short share links (maps.app.goo.gl) carry no
 * coordinates, so the portal follows the redirect server-side.
 *
 * Auto-filled coords (coordsAuto) FOLLOW the link: replacing the link
 * replaces them, clearing the link clears them. Hand-typed coords are never
 * touched — typing in the coords field drops the auto flag.
 */
const linkMayFill = (s: ReccePlanStop) => !s.coords.trim() || s.coordsAuto === true
const setAutoCoords = (s: ReccePlanStop, c: { lat: number, lng: number }) => {
  s.coords = `${c.lat}, ${c.lng}`
  s.coordsAuto = true
}
const onLinkChange = async (s: ReccePlanStop) => {
  const link = s.link.trim()
  if (!linkMayFill(s)) return
  if (!link) {
    // Link removed → auto coords go with it.
    if (s.coordsAuto) {
      s.coords = ''
      s.coordsAuto = false
    }
    return
  }
  const direct = extractCoordsFromMapsUrl(link)
  if (direct) {
    setAutoCoords(s, direct)
    return
  }
  if (!isShortMapsLink(link)) return
  try {
    const c = await $fetch<{ lat: number, lng: number }>('/api/portal/tools/resolve-maps-link', { query: { url: link } })
    if (linkMayFill(s) && s.link.trim() === link) setAutoCoords(s, c)
  }
  catch { /* link without coordinates — the field just stays as it is */ }
}
const onLinkPaste = (s: ReccePlanStop) => setTimeout(() => onLinkChange(s), 50)

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(new Error('read failed'))
    r.readAsDataURL(blob)
  })

/** Downscale picked photos client-side so the saved plan and PDF stay small. */
const addPhotos = async (s: ReccePlanStop, e: Event) => {
  const input = e.target as HTMLInputElement
  const files = [...(input.files ?? [])].slice(0, 2 - s.photos.length)
  input.value = ''
  for (const f of files) {
    try {
      const { blob } = await downscaleImage(f, 700, 'image/jpeg', 0.75)
      s.photos.push(await blobToDataUrl(blob))
    }
    catch {
      error.value = t('portal.tools.recce.photoFailed')
    }
  }
}

// ── Location-photo picker ────────────────────────────────────────────────────
// Browses the user's tökustaðamyndir folders and copies a chosen photo into
// the stop (downscaled to the same ~700px JPEG as direct uploads).
const picker = ref<ReccePlanStop | null>(null)
const pickerAlbum = ref<LocationAlbumDetail | null>(null)
const pickerRoots = ref<LocationAlbumSummary[]>([])
const pickerLoading = ref(false)
const pickerError = ref('')
const pickerBusy = ref(false)

const pickerFolders = computed<LocationAlbumSummary[]>(() =>
  pickerAlbum.value ? pickerAlbum.value.children : pickerRoots.value)

const openPicker = (s: ReccePlanStop) => {
  picker.value = s
  openAlbum(pickerAlbum.value?.id ?? null)
}
const closePicker = () => {
  picker.value = null
}
const openAlbum = async (id: string | null) => {
  pickerLoading.value = true
  pickerError.value = ''
  try {
    if (id) {
      pickerAlbum.value = await $fetch<LocationAlbumDetail>(`/api/portal/tools/location-albums/${id}`)
    }
    else {
      pickerAlbum.value = null
      pickerRoots.value = await $fetch<LocationAlbumSummary[]>('/api/portal/tools/location-albums')
    }
  }
  catch {
    pickerError.value = t('portal.tools.recce.pickerFailed')
  }
  finally {
    pickerLoading.value = false
  }
}
const thumbUrl = (p: LocationPhoto) =>
  `/api/portal/tools/location-albums/${p.albumId}/photos/${p.id}/file?size=thumb`

const pickPhoto = async (p: LocationPhoto) => {
  const s = picker.value
  if (!s || s.photos.length >= 2 || pickerBusy.value) return
  pickerBusy.value = true
  pickerError.value = ''
  try {
    const blob = await $fetch<Blob>(
      `/api/portal/tools/location-albums/${p.albumId}/photos/${p.id}/file`,
      { responseType: 'blob' },
    )
    const { blob: small } = await downscaleImage(blob, 700, 'image/jpeg', 0.75)
    s.photos.push(await blobToDataUrl(small))
    if (s.photos.length >= 2) closePicker()
  }
  catch {
    pickerError.value = t('portal.tools.recce.pickerFailed')
  }
  finally {
    pickerBusy.value = false
  }
}

const moveStop = (i: number, dir: -1 | 1) => {
  const j = i + dir
  if (j < 0 || j >= plan.stops.length) return
  const [s] = plan.stops.splice(i, 1)
  plan.stops.splice(j, 0, s!)
}

// Icelandic is spelled out by hand: not every browser ships is-IS locale data,
// and the fallback ("2026 M08 27, Thu") is unacceptable on a call sheet.
const IS_DAYS = ['Sunnudagur', 'Mánudagur', 'Þriðjudagur', 'Miðvikudagur', 'Fimmtudagur', 'Föstudagur', 'Laugardagur']
const IS_MONTHS = ['janúar', 'febrúar', 'mars', 'apríl', 'maí', 'júní', 'júlí', 'ágúst', 'september', 'október', 'nóvember', 'desember']
const formatDate = (iso: string): string => {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  if (locale.value === 'is') {
    return `${IS_DAYS[d.getDay()]}, ${d.getDate()}. ${IS_MONTHS[d.getMonth()]} ${d.getFullYear()}`
  }
  const s = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const slug = (s: string): string => s.toLowerCase()
  .replace(/ð/g, 'd').replace(/þ/g, 'th').replace(/æ/g, 'ae')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const exportPdf = async () => {
  error.value = ''
  notice.value = ''
  // Times are computed over the FULL list so the PDF matches what's on screen,
  // then blank filler stops are dropped.
  const stopTimes = times.value
  const kept = plan.stops
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.name.trim() || s.address.trim() || s.notes.trim())
  if (!kept.length) {
    error.value = t('portal.tools.recce.needStop')
    return
  }
  const stops = kept.map(({ s, i }) => ({
    time: stopTimes[i]?.arrive ?? '',
    endTime: stopTimes[i]?.depart ?? '',
    name: s.name,
    address: s.address,
    notes: s.notes,
    link: s.link,
    travel: i < plan.stops.length - 1 && s.travelMin > 0
      ? t('portal.tools.recce.driveLabel', { d: formatDuration(s.travelMin) })
      : '',
    photos: s.photos,
  }))
  busy.value = true
  try {
    // Overview map: every stop with coordinates becomes a numbered pin, and
    // the driving route between them comes from OSRM (dashed straight lines
    // when routing is unavailable). Skipped entirely without coordinates.
    let overviewMap: { image: string } | null = null
    const points = kept.flatMap(({ s }, n) => {
      const c = parseCoords(s)
      return c ? [{ lat: c.lat, lng: c.lng, n: n + 1, name: s.name.trim() }] : []
    })
    if (points.length) {
      try {
        const routeLine = await fetchDrivingRoute(points)
        overviewMap = { image: await renderRecceOverviewMap(points, routeLine) }
      }
      catch {
        notice.value = t('portal.tools.recce.mapFailed')
      }
    }

    const bytes = await exportReccePdf({
      project: name.value,
      subtitle: plan.subtitle,
      date: plan.date,
      note: plan.note,
      stops,
      contacts: plan.contacts,
      overviewMap,
    }, {
      contacts: t('portal.tools.recce.contacts'),
      mapLink: t('portal.tools.recce.mapLink'),
      continued: t('portal.tools.recce.continued'),
      dateText: plan.date ? formatDate(plan.date) : '',
      mapTitle: t('portal.tools.recce.mapTitle'),
    })
    const fname = `${slug(name.value) || 'recce'}${plan.date ? `-${plan.date}` : ''}.pdf`
    downloadBlob(bytes, fname, 'application/pdf')
  }
  catch {
    error.value = t('portal.tools.recce.failed')
  }
  finally {
    busy.value = false
  }
}

useHead({ title: 'Recce áætlun · Hjálpartól · Portal' })
</script>
