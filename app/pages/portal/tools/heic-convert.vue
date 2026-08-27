<template>
  <PortalToolsShell :title="$t('portal.tools.heic.title')" :desc="$t('portal.tools.heic.long')">
    <PortalToolsDropzone
      v-model="files"
      accept=".heic,.heif,image/heic,image/heif"
      multiple
      :hint="$t('portal.tools.heic.hint')"
    />

    <div class="mt-6 flex flex-wrap gap-6">
      <div>
        <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.tools.heic.format') }}</label>
        <select v-model="format" class="input-dark w-40">
          <option value="image/jpeg">JPG</option>
          <option value="image/png">PNG</option>
        </select>
      </div>
      <div v-if="format === 'image/jpeg'">
        <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">
          {{ $t('portal.tools.heic.quality') }} · {{ Math.round(quality * 100) }}%
        </label>
        <input v-model.number="quality" type="range" min="0.3" max="1" step="0.05" class="w-40 accent-gold-500">
      </div>
    </div>

    <p v-if="error" class="mt-4 text-sm text-signal-500">{{ error }}</p>

    <button
      type="button"
      class="btn-gold mt-6 disabled:opacity-50"
      :disabled="!files.length || busy"
      @click="convert"
    >
      {{ busy ? $t('portal.tools.heic.converting', { done, total }) : $t('portal.tools.heic.action') }}
    </button>

    <!-- Results -->
    <div v-if="results.length" class="mt-8">
      <div class="flex items-center justify-between">
        <p class="kicker">{{ $t('portal.tools.heic.results') }}</p>
        <button
          type="button"
          class="text-xs uppercase tracking-widest text-bone-400 hover:text-gold-400 transition-colors"
          @click="downloadAll"
        >
          {{ $t('portal.tools.heic.downloadAll') }}
        </button>
      </div>
      <ul class="mt-3 border border-ink-800 divide-y divide-ink-800">
        <li v-for="r in results" :key="r.name" class="flex items-center gap-3 p-3 bg-ink-900/50">
          <img :src="r.url" :alt="r.name" class="h-12 w-12 object-cover border border-ink-700 shrink-0">
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm text-bone-100">{{ r.name }}</p>
            <p class="text-xs text-bone-500">{{ formatBytes(r.size) }}</p>
          </div>
          <button
            type="button"
            class="btn-ghost !px-4 !py-2 !text-xs shrink-0"
            @click="downloadOne(r)"
          >
            {{ $t('portal.tools.heic.download') }}
          </button>
        </li>
      </ul>
    </div>
  </PortalToolsShell>
</template>

<script setup lang="ts">
// heic2any is vendored to /vendor/heic2any.min.js and loaded via a <script> tag:
// its UMD bundle can't be processed by the Nitro/Rollup CommonJS plugin, so we keep
// it out of the app bundle entirely. The UMD footer attaches window.heic2any.
type Heic2Any = (opts: { blob: Blob, toType?: string, quality?: number }) => Promise<Blob | Blob[]>
declare global {
  interface Window { heic2any?: Heic2Any }
}

definePageMeta({ layout: 'portal' })
usePortalToolGuard('heic-convert')

const { t } = useI18n()

interface Result { name: string, url: string, blob: Blob, size: number }

const files = ref<File[]>([])
const format = ref<'image/jpeg' | 'image/png'>('image/jpeg')
const quality = ref(0.9)
const busy = ref(false)
const error = ref('')
const done = ref(0)
const total = ref(0)
const results = ref<Result[]>([])

const revokeResults = () => {
  results.value.forEach(r => URL.revokeObjectURL(r.url))
  results.value = []
}

const convert = async () => {
  error.value = ''
  revokeResults()
  busy.value = true
  done.value = 0
  total.value = files.value.length
  try {
    // Load the vendored browser build on demand; it registers window.heic2any.
    await loadScript('/vendor/heic2any.min.js')
    const heic2any = window.heic2any
    if (!heic2any) throw new Error('heic2any unavailable')
    const ext = format.value === 'image/png' ? 'png' : 'jpg'
    for (const file of files.value) {
      const converted = await heic2any({
        blob: file,
        toType: format.value,
        ...(format.value === 'image/jpeg' ? { quality: quality.value } : {}),
      })
      // heic2any may return a single Blob or an array (multi-image HEIC).
      const blob = Array.isArray(converted) ? converted[0]! : converted
      results.value.push({
        name: `${baseName(file.name)}.${ext}`,
        url: URL.createObjectURL(blob),
        blob,
        size: blob.size,
      })
      done.value += 1
    }
  }
  catch {
    error.value = t('portal.tools.heic.failed')
  }
  finally {
    busy.value = false
  }
}

const downloadOne = (r: Result) => downloadBlob(r.blob, r.name)
const downloadAll = () => results.value.forEach(downloadOne)

onBeforeUnmount(revokeResults)

useHead({ title: 'HEIC · Hjálpartól · Portal' })
</script>
