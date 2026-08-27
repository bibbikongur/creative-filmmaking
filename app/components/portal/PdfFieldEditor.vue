<template>
  <div class="border border-ink-800 bg-ink-950 p-4">
    <!-- Field palette -->
    <p class="text-xs text-bone-400">{{ $t('portal.docs.placeHint') }}</p>
    <div class="mt-3 flex flex-wrap gap-2">
      <button
        v-for="type in FIELD_TYPES"
        :key="type"
        type="button"
        class="border px-3 py-1.5 text-xs uppercase tracking-wider transition-colors"
        :class="armed === type
          ? 'border-gold-500 bg-gold-500 text-ink-950'
          : 'border-ink-700 text-bone-400 hover:border-gold-500 hover:text-gold-400'"
        @click="armed = armed === type ? null : type"
      >
        {{ $t(`portal.docs.fields.${type}`) }}
      </button>
      <button
        type="button"
        class="btn-gold !px-4 !py-1.5 !text-xs ml-auto disabled:opacity-60"
        :disabled="saving || loading"
        @click="save"
      >
        {{ saving ? '…' : $t('portal.docs.saveFields') }}
      </button>
    </div>

    <p v-if="error" class="mt-3 text-sm text-signal-500">{{ error }}</p>
    <p v-else-if="loading" class="mt-3 text-sm text-bone-400">{{ $t('portal.loading') }}</p>

    <!-- Pages -->
    <div ref="pagesEl" class="mt-4 space-y-4 max-h-[75vh] overflow-y-auto">
      <div v-for="p in pages" :key="p.num" class="mx-auto" :style="{ width: `${p.cssWidth}px` }">
        <p class="mb-1 text-[11px] uppercase tracking-widest text-bone-400">{{ $t('portal.docs.page', { n: p.num }) }}</p>
        <div
          class="relative select-none"
          :style="{ width: `${p.cssWidth}px`, height: `${p.cssHeight}px` }"
          :class="armed ? 'cursor-crosshair' : ''"
          @pointerdown="onPagePointerDown(p, $event)"
        >
          <canvas :ref="el => setCanvas(p.num, el as HTMLCanvasElement | null)" class="absolute inset-0" />
          <div
            v-for="f in fieldsOnPage(p.num)"
            :key="f.id"
            class="absolute border text-[10px] uppercase tracking-wider flex items-center overflow-hidden cursor-move"
            :class="f.type === 'signature' || f.type === 'dateSigned'
              ? 'border-gold-500 bg-gold-500/20 text-gold-400'
              : 'border-sky-500 bg-sky-500/20 text-sky-300'"
            :style="{
              left: `${f.x * p.scale}px`,
              top: `${f.y * p.scale}px`,
              width: `${f.w * p.scale}px`,
              height: `${f.h * p.scale}px`,
            }"
            @pointerdown.stop="startDrag(f, p, $event)"
          >
            <span class="px-1 truncate pointer-events-none">{{ $t(`portal.docs.fields.${f.type}`) }}</span>
            <button
              type="button"
              class="absolute top-0 right-0 px-1 text-signal-500 hover:text-signal-500/70 leading-none"
              @pointerdown.stop
              @click.stop="removeField(f)"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DocKind, TemplateField, TemplateFieldType } from '~/types'

// Visual field placement over a pdf.js render of the template. All stored
// coordinates are PDF points (72dpi) from the top-left of each page; the
// signing page previews with the same units and docSigning stamps the PDF.

const props = defineProps<{
  jobId: string
  kind: DocKind
  initialFields: TemplateField[]
}>()

const emit = defineEmits<{ save: [payload: { fields: TemplateField[], pageCount: number }] }>()

const FIELD_TYPES: TemplateFieldType[] = ['name', 'role', 'email', 'phone', 'dayRate', 'date', 'signature', 'dateSigned']
const DEFAULT_SIZES: Record<TemplateFieldType, { w: number, h: number }> = {
  name: { w: 160, h: 18 },
  role: { w: 160, h: 18 },
  email: { w: 180, h: 18 },
  phone: { w: 120, h: 18 },
  dayRate: { w: 120, h: 18 },
  date: { w: 100, h: 18 },
  signature: { w: 140, h: 40 },
  dateSigned: { w: 100, h: 18 },
}

interface PageInfo {
  num: number
  /** CSS px per PDF point at the rendered size. */
  scale: number
  cssWidth: number
  cssHeight: number
}

const { t } = useI18n()
const fields = ref<TemplateField[]>(props.initialFields.map(f => ({ ...f })))
const pages = ref<PageInfo[]>([])
const pageCount = ref(0)
const armed = ref<TemplateFieldType | null>(null)
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const pagesEl = ref<HTMLElement | null>(null)

const canvases = new Map<number, HTMLCanvasElement>()
const setCanvas = (num: number, el: HTMLCanvasElement | null) => {
  if (el) canvases.set(num, el)
}

const fieldsOnPage = (page: number) => fields.value.filter(f => f.page === page)

onMounted(async () => {
  try {
    const [pdfjs, data] = await Promise.all([
      import('pdfjs-dist'),
      $fetch<ArrayBuffer>(`/api/portal/jobs/${props.jobId}/doc-templates/${props.kind}/file`, {
        responseType: 'arrayBuffer',
        query: { t: Date.now() },
      }),
    ])
    pdfjs.GlobalWorkerOptions.workerSrc
      = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

    const doc = await pdfjs.getDocument({ data }).promise
    pageCount.value = doc.numPages
    const containerWidth = Math.min(760, (pagesEl.value?.clientWidth ?? 760))

    const infos: PageInfo[] = []
    for (let num = 1; num <= doc.numPages; num++) {
      const page = await doc.getPage(num)
      const base = page.getViewport({ scale: 1 })
      const scale = containerWidth / base.width
      infos.push({ num, scale, cssWidth: Math.round(base.width * scale), cssHeight: Math.round(base.height * scale) })
    }
    pages.value = infos
    loading.value = false

    // Render after the canvases exist in the DOM.
    await nextTick()
    const dpr = window.devicePixelRatio || 1
    for (const info of infos) {
      const canvas = canvases.get(info.num)
      if (!canvas) continue
      const page = await doc.getPage(info.num)
      const viewport = page.getViewport({ scale: info.scale * dpr })
      canvas.width = viewport.width
      canvas.height = viewport.height
      canvas.style.width = `${info.cssWidth}px`
      canvas.style.height = `${info.cssHeight}px`
      await page.render({ canvas, viewport }).promise
    }
  }
  catch (e: any) {
    console.error('[pdf-editor]', e)
    error.value = e?.data?.statusMessage || t('portal.loadFailed')
    loading.value = false
  }
})

// ── Placement ──

const onPagePointerDown = (p: PageInfo, e: PointerEvent) => {
  if (!armed.value) return
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const size = DEFAULT_SIZES[armed.value]
  const x = (e.clientX - rect.left) / p.scale - size.w / 2
  const y = (e.clientY - rect.top) / p.scale - size.h / 2
  fields.value.push({
    id: `f-${Math.random().toString(36).slice(2, 10)}`,
    type: armed.value,
    page: p.num,
    x: clamp(x, 0, p.cssWidth / p.scale - size.w),
    y: clamp(y, 0, p.cssHeight / p.scale - size.h),
    w: size.w,
    h: size.h,
  })
  armed.value = null
}

const removeField = (f: TemplateField) => {
  fields.value = fields.value.filter(x => x.id !== f.id)
}

// ── Dragging ──

let drag: { field: TemplateField, page: PageInfo, dx: number, dy: number } | null = null

const startDrag = (f: TemplateField, p: PageInfo, e: PointerEvent) => {
  drag = { field: f, page: p, dx: e.clientX - f.x * p.scale, dy: e.clientY - f.y * p.scale }
  window.addEventListener('pointermove', onDragMove)
  window.addEventListener('pointerup', endDrag, { once: true })
}

const onDragMove = (e: PointerEvent) => {
  if (!drag) return
  const { field, page, dx, dy } = drag
  field.x = clamp((e.clientX - dx) / page.scale, 0, page.cssWidth / page.scale - field.w)
  field.y = clamp((e.clientY - dy) / page.scale, 0, page.cssHeight / page.scale - field.h)
}

const endDrag = () => {
  drag = null
  window.removeEventListener('pointermove', onDragMove)
}

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onDragMove)
})

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), Math.max(min, max))

const save = () => {
  saving.value = true
  try {
    emit('save', { fields: fields.value.map(f => ({ ...f })), pageCount: pageCount.value })
  }
  finally {
    saving.value = false
  }
}
</script>
