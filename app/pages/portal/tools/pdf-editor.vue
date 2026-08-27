<template>
  <PortalToolsShell :title="$t('portal.tools.pdfEdit.title')" :desc="$t('portal.tools.pdfEdit.long')">
    <PortalToolsDropzone
      v-model="files"
      accept="application/pdf,.pdf"
      :multiple="false"
      :hint="$t('portal.tools.pdfEdit.hint')"
    />

    <p v-if="error" class="mt-4 text-sm text-signal-500">{{ error }}</p>
    <p v-else-if="loading" class="mt-4 text-sm text-bone-400">{{ $t('portal.loading') }}</p>

    <!-- Toolbar -->
    <div v-if="pages.length" class="mt-6 border border-ink-800 bg-ink-950 p-3">
      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="m in MODES"
          :key="m"
          type="button"
          class="border px-3 py-1.5 text-xs uppercase tracking-wider transition-colors"
          :class="mode === m
            ? 'border-gold-500 bg-gold-500 text-ink-950'
            : 'border-ink-700 text-bone-400 hover:border-gold-500 hover:text-gold-400'"
          @click="setMode(m)"
        >
          {{ $t(`portal.tools.pdfEdit.modes.${m}`) }}
        </button>

        <span class="mx-1 hidden sm:block h-5 w-px bg-ink-700" />

        <!-- Text size -->
        <label v-if="mode === 'text' || activeText" class="flex items-center gap-1.5 text-xs text-bone-400">
          {{ $t('portal.tools.pdfEdit.size') }}
          <select v-model.number="textSize" class="input-dark !py-1 !px-2 !text-xs w-16">
            <option v-for="s in [10, 12, 14, 18, 24, 32]" :key="s" :value="s">{{ s }}</option>
          </select>
        </label>

        <!-- Stroke width -->
        <label v-if="mode === 'draw'" class="flex items-center gap-1.5 text-xs text-bone-400">
          {{ $t('portal.tools.pdfEdit.strokeWidth') }}
          <select v-model.number="strokeWidth" class="input-dark !py-1 !px-2 !text-xs w-16">
            <option v-for="s in [1, 2, 4, 6]" :key="s" :value="s">{{ s }}</option>
          </select>
        </label>

        <!-- Color -->
        <div v-if="mode === 'text' || mode === 'draw' || activeText" class="flex items-center gap-1.5">
          <span class="text-xs text-bone-400">{{ $t('portal.tools.pdfEdit.color') }}</span>
          <button
            v-for="c in COLORS"
            :key="c"
            type="button"
            class="h-5 w-5 border transition-transform"
            :class="color === c ? 'border-gold-500 scale-110' : 'border-ink-600'"
            :style="{ backgroundColor: c }"
            :aria-label="c"
            @click="color = c"
          />
        </div>

        <button
          type="button"
          class="ml-auto text-xs uppercase tracking-widest text-bone-500 hover:text-gold-400 transition-colors disabled:opacity-30"
          :disabled="!items.length"
          @click="undo"
        >
          {{ $t('portal.tools.pdfEdit.undo') }}
        </button>
      </div>
      <p class="mt-2 text-xs text-bone-500">{{ $t(`portal.tools.pdfEdit.hints.${mode}`) }}</p>
    </div>

    <!-- Pages -->
    <div ref="pagesEl" class="mt-4 space-y-6">
      <div v-for="p in pages" :key="p.num" class="mx-auto" :style="{ width: `${p.cssWidth}px` }">
        <div class="mb-1 flex items-center justify-between">
          <p class="text-[11px] uppercase tracking-widest text-bone-400">
            {{ $t('portal.tools.pdfEdit.page', { n: p.num }) }}
            <span v-if="deletedPages.has(p.num)" class="ml-2 text-signal-500">{{ $t('portal.tools.pdfEdit.deleted') }}</span>
          </p>
          <button
            type="button"
            class="text-[11px] uppercase tracking-widest transition-colors"
            :class="deletedPages.has(p.num) ? 'text-gold-400 hover:text-gold-500' : 'text-bone-500 hover:text-signal-500'"
            @click="togglePage(p.num)"
          >
            {{ deletedPages.has(p.num) ? $t('portal.tools.pdfEdit.restorePage') : $t('portal.tools.pdfEdit.deletePage') }}
          </button>
        </div>

        <div
          class="relative select-none"
          :class="[
            mode !== 'select' ? 'cursor-crosshair touch-none' : '',
            deletedPages.has(p.num) ? 'opacity-30 pointer-events-none' : '',
          ]"
          :style="{ width: `${p.cssWidth}px`, height: `${p.cssHeight}px` }"
          @pointerdown="onPageDown(p, $event)"
        >
          <canvas :ref="el => setCanvas(p.num, el as HTMLCanvasElement | null)" class="absolute inset-0" />

          <!-- White-out boxes -->
          <div
            v-for="it in rectsOn(p.num)"
            :key="it.id"
            class="absolute z-10 bg-white border border-ink-300/60 group"
            :class="mode === 'select' ? 'cursor-move' : 'pointer-events-none'"
            :style="boxStyle(it, p)"
            @pointerdown.stop="startMove(it, p, $event)"
          >
            <button
              type="button"
              class="absolute -top-2 -right-2 z-40 hidden group-hover:block h-4 w-4 leading-none text-[10px] bg-ink-950 text-signal-500 border border-ink-700"
              @pointerdown.stop
              @click.stop="removeItem(it)"
            >✕</button>
            <span
              class="absolute -bottom-1 -right-1 z-40 hidden group-hover:block h-3 w-3 bg-gold-500 cursor-nwse-resize"
              @pointerdown.stop="startResize(it, p, $event)"
            />
          </div>

          <!-- Freehand strokes -->
          <canvas :ref="el => setOverlay(p.num, el as HTMLCanvasElement | null)" class="absolute inset-0 z-20 pointer-events-none" />

          <!-- Images -->
          <div
            v-for="it in imagesOn(p.num)"
            :key="it.id"
            class="absolute z-30 group"
            :class="mode === 'select' ? 'cursor-move' : 'pointer-events-none'"
            :style="boxStyle(it, p)"
            @pointerdown.stop="startMove(it, p, $event)"
          >
            <img :src="it.src.dataUrl" class="h-full w-full" draggable="false" >
            <button
              type="button"
              class="absolute -top-2 -right-2 z-40 hidden group-hover:block h-4 w-4 leading-none text-[10px] bg-ink-950 text-signal-500 border border-ink-700"
              @pointerdown.stop
              @click.stop="removeItem(it)"
            >✕</button>
            <span
              class="absolute -bottom-1 -right-1 z-40 hidden group-hover:block h-3 w-3 bg-gold-500 cursor-nwse-resize"
              @pointerdown.stop="startResize(it, p, $event)"
            />
          </div>

          <!-- Text -->
          <div
            v-for="it in textsOn(p.num)"
            :key="it.id"
            class="absolute z-30 group"
            :class="mode === 'select' ? '' : 'pointer-events-none'"
            :style="{ left: `${it.x * p.scale}px`, top: `${it.y * p.scale}px` }"
          >
            <button
              type="button"
              class="absolute top-0 -left-4 hidden group-hover:block text-bone-500 hover:text-gold-400 cursor-move text-xs leading-none"
              @pointerdown.stop="startMove(it, p, $event)"
            >⠿</button>
            <input
              v-model="it.text"
              type="text"
              :data-text-id="it.id"
              class="block bg-transparent border border-dashed border-transparent hover:border-gold-500/40 focus:border-gold-500/70 outline-none p-0"
              :style="{
                color: it.color,
                fontSize: `${it.size * p.scale}px`,
                lineHeight: 1.2,
                fontFamily: 'Helvetica, Arial, sans-serif',
                width: `${Math.max(4, it.text.length + 2) * it.size * 0.55 * p.scale}px`,
              }"
              @pointerdown.stop
              @focus="onTextFocus(it)"
              @blur="onTextBlur(it)"
            >
            <button
              type="button"
              class="absolute top-0 -right-4 hidden group-hover:block text-signal-500 text-xs leading-none"
              @pointerdown.stop
              @click.stop="removeItem(it)"
            >✕</button>
          </div>
        </div>
      </div>
    </div>

    <button
      v-if="pages.length"
      type="button"
      class="btn-gold mt-6 disabled:opacity-50"
      :disabled="busy || deletedPages.size >= pages.length"
      @click="exportPdf"
    >
      {{ busy ? $t('portal.tools.working') : $t('portal.tools.pdfEdit.action') }}
    </button>

    <!-- Hidden picker for the image tool -->
    <input
      ref="imgInput"
      type="file"
      accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
      class="hidden"
      @change="onImagePicked"
    >
  </PortalToolsShell>
</template>

<script setup lang="ts">
import { PDFDocument, StandardFonts, rgb, LineCapStyle } from 'pdf-lib'

// Fully client-side PDF editor: pdf.js renders the pages, annotations live as
// overlay elements, and pdf-lib stamps everything into a new file on export.
// Coordinates are PDF points (72dpi) from the top-left of each page, the same
// convention as PdfFieldEditor / docSigning.

definePageMeta({ layout: 'portal' })
usePortalToolGuard('pdf-editor')

const { t } = useI18n()

type Mode = 'select' | 'text' | 'draw' | 'rect' | 'image'
const MODES: Mode[] = ['select', 'text', 'draw', 'rect', 'image']
const COLORS = ['#111111', '#dc2626', '#2563eb', '#15803d']

interface PageInfo {
  num: number
  /** CSS px per PDF point at the rendered size. */
  scale: number
  cssWidth: number
  cssHeight: number
  /** Page size in PDF points. */
  ptWidth: number
  ptHeight: number
}

interface PlacedImage {
  bytes: Uint8Array
  format: 'jpg' | 'png'
  dataUrl: string
  natW: number
  natH: number
}

interface TextItem { id: string, kind: 'text', page: number, x: number, y: number, size: number, color: string, text: string }
interface RectItem { id: string, kind: 'rect', page: number, x: number, y: number, w: number, h: number }
interface ImageItem { id: string, kind: 'image', page: number, x: number, y: number, w: number, h: number, src: PlacedImage }
interface DrawItem { id: string, kind: 'draw', page: number, color: string, width: number, points: { x: number, y: number }[] }
type EditorItem = TextItem | RectItem | ImageItem | DrawItem

const files = ref<File[]>([])
const pages = ref<PageInfo[]>([])
const items = ref<EditorItem[]>([])
const deletedPages = ref<Set<number>>(new Set())
const mode = ref<Mode>('select')
const textSize = ref(14)
const strokeWidth = ref(2)
const color = ref(COLORS[0]!)
const activeText = ref<string | null>(null)
const pendingImage = ref<PlacedImage | null>(null)
const loading = ref(false)
const busy = ref(false)
const error = ref('')

const pagesEl = ref<HTMLElement | null>(null)
const imgInput = ref<HTMLInputElement | null>(null)

let origBytes: Uint8Array | null = null
let origName = ''

const canvases = new Map<number, HTMLCanvasElement>()
const overlays = new Map<number, HTMLCanvasElement>()
const setCanvas = (num: number, el: HTMLCanvasElement | null) => { if (el) canvases.set(num, el) }
const setOverlay = (num: number, el: HTMLCanvasElement | null) => { if (el) overlays.set(num, el) }

const textsOn = (n: number) => items.value.filter(i => i.kind === 'text' && i.page === n) as TextItem[]
const rectsOn = (n: number) => items.value.filter(i => i.kind === 'rect' && i.page === n) as RectItem[]
const imagesOn = (n: number) => items.value.filter(i => i.kind === 'image' && i.page === n) as ImageItem[]
const drawsOn = (n: number) => items.value.filter(i => i.kind === 'draw' && i.page === n) as DrawItem[]

const uid = () => `e-${Math.random().toString(36).slice(2, 10)}`
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), Math.max(min, max))

const boxStyle = (it: { x: number, y: number, w: number, h: number }, p: PageInfo) => ({
  left: `${it.x * p.scale}px`,
  top: `${it.y * p.scale}px`,
  width: `${it.w * p.scale}px`,
  height: `${it.h * p.scale}px`,
})

// ── Loading ──

watch(files, async (list) => {
  if (!list.length) { reset(); return }
  await loadPdf(list[0]!)
})

const reset = () => {
  pages.value = []
  items.value = []
  deletedPages.value = new Set()
  mode.value = 'select'
  pendingImage.value = null
  activeText.value = null
  error.value = ''
  origBytes = null
  canvases.clear()
  overlays.clear()
}

const loadPdf = async (file: File) => {
  reset()
  loading.value = true
  try {
    const bytes = new Uint8Array(await file.arrayBuffer())
    origBytes = bytes
    origName = file.name

    const pdfjs = await import('pdfjs-dist')
    pdfjs.GlobalWorkerOptions.workerSrc
      = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

    // pdf.js detaches the buffer it gets, so hand it a copy.
    const doc = await pdfjs.getDocument({ data: bytes.slice() }).promise
    const containerWidth = Math.min(672, pagesEl.value?.clientWidth || 672)

    const infos: PageInfo[] = []
    for (let num = 1; num <= doc.numPages; num++) {
      const page = await doc.getPage(num)
      const base = page.getViewport({ scale: 1 })
      const scale = containerWidth / base.width
      infos.push({
        num,
        scale,
        cssWidth: Math.round(base.width * scale),
        cssHeight: Math.round(base.height * scale),
        ptWidth: base.width,
        ptHeight: base.height,
      })
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

      const overlay = overlays.get(info.num)
      if (overlay) {
        overlay.width = viewport.width
        overlay.height = viewport.height
        overlay.style.width = `${info.cssWidth}px`
        overlay.style.height = `${info.cssHeight}px`
      }
    }
  }
  catch (e) {
    console.error('[pdf-editor]', e)
    error.value = t('portal.tools.pdfEdit.loadFailed')
    loading.value = false
  }
}

// ── Toolbar ──

const setMode = (m: Mode) => {
  if (m === 'image') {
    imgInput.value?.click()
    return
  }
  mode.value = m
}

const onImagePicked = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (imgInput.value) imgInput.value.value = ''
  if (!file) return
  try {
    const isJpg = /jpe?g$/i.test(file.type) || /\.jpe?g$/i.test(file.name)
    const isPng = /png$/i.test(file.type) || /\.png$/i.test(file.name)
    const bytes = isJpg || isPng
      ? new Uint8Array(await file.arrayBuffer())
      : await imageToPngBytes(file)
    const bitmap = await createImageBitmap(file)
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve(r.result as string)
      r.onerror = reject
      r.readAsDataURL(new Blob([bytes as BlobPart], { type: isJpg ? 'image/jpeg' : 'image/png' }))
    })
    pendingImage.value = { bytes, format: isJpg ? 'jpg' : 'png', dataUrl, natW: bitmap.width, natH: bitmap.height }
    bitmap.close()
    mode.value = 'image'
  }
  catch {
    error.value = t('portal.tools.pdfEdit.loadFailed')
  }
}

const undo = () => {
  const last = items.value.pop()
  if (last?.kind === 'draw') redrawStrokes(last.page)
}

const removeItem = (it: EditorItem) => {
  items.value = items.value.filter(x => x.id !== it.id)
  if (it.kind === 'draw') redrawStrokes(it.page)
}

const togglePage = (n: number) => {
  const next = new Set(deletedPages.value)
  if (next.has(n)) next.delete(n)
  else next.add(n)
  deletedPages.value = next
}

// Changing size/color while a text item is focused restyles it.
watch([textSize, color], () => {
  if (!activeText.value) return
  const it = items.value.find(i => i.id === activeText.value) as TextItem | undefined
  if (it) { it.size = textSize.value; it.color = color.value }
})

const onTextFocus = (it: TextItem) => {
  activeText.value = it.id
  textSize.value = it.size
  color.value = it.color
}

const onTextBlur = (it: TextItem) => {
  if (activeText.value === it.id) activeText.value = null
  if (!it.text.trim()) removeItem(it)
}

// ── Strokes ──

const redrawStrokes = (n: number) => {
  const canvas = overlays.get(n)
  const p = pages.value.find(x => x.num === n)
  if (!canvas || !p) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const dpr = window.devicePixelRatio || 1
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.setTransform(p.scale * dpr, 0, 0, p.scale * dpr, 0, 0)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const it of drawsOn(n)) {
    if (it.points.length < 2) continue
    ctx.strokeStyle = it.color
    ctx.lineWidth = it.width
    ctx.beginPath()
    ctx.moveTo(it.points[0]!.x, it.points[0]!.y)
    for (const pt of it.points.slice(1)) ctx.lineTo(pt.x, pt.y)
    ctx.stroke()
  }
}

// ── Pointer interactions ──

interface Action {
  type: 'move' | 'resize' | 'rect-new' | 'draw'
  item: EditorItem
  page: PageInfo
  startX: number
  startY: number
  orig: { x: number, y: number, w: number, h: number }
  /** Page container rect at gesture start (draw / rect-new). */
  rect: DOMRect | null
}
let action: Action | null = null

const pagePoint = (p: PageInfo, rect: DOMRect, e: PointerEvent) => ({
  x: clamp((e.clientX - rect.left) / p.scale, 0, p.ptWidth),
  y: clamp((e.clientY - rect.top) / p.scale, 0, p.ptHeight),
})

const bindWindow = () => {
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp, { once: true })
}

const onPageDown = (p: PageInfo, e: PointerEvent) => {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const pt = pagePoint(p, rect, e)

  if (mode.value === 'text') {
    const it: TextItem = {
      id: uid(), kind: 'text', page: p.num,
      x: pt.x, y: clamp(pt.y - textSize.value * 0.6, 0, p.ptHeight - textSize.value),
      size: textSize.value, color: color.value, text: '',
    }
    items.value.push(it)
    mode.value = 'select'
    nextTick(() => {
      const el = document.querySelector<HTMLInputElement>(`[data-text-id="${it.id}"]`)
      el?.focus()
    })
    return
  }

  if (mode.value === 'rect') {
    const it: RectItem = { id: uid(), kind: 'rect', page: p.num, x: pt.x, y: pt.y, w: 0, h: 0 }
    items.value.push(it)
    action = { type: 'rect-new', item: it, page: p, startX: pt.x, startY: pt.y, orig: { x: pt.x, y: pt.y, w: 0, h: 0 }, rect }
    bindWindow()
    return
  }

  if (mode.value === 'image' && pendingImage.value) {
    const src = pendingImage.value
    const w = Math.min(200, src.natW, p.ptWidth * 0.5)
    const h = w * (src.natH / src.natW)
    items.value.push({
      id: uid(), kind: 'image', page: p.num,
      x: clamp(pt.x - w / 2, 0, p.ptWidth - w),
      y: clamp(pt.y - h / 2, 0, p.ptHeight - h),
      w, h, src,
    })
    pendingImage.value = null
    mode.value = 'select'
    return
  }

  if (mode.value === 'draw') {
    e.preventDefault()
    const it: DrawItem = { id: uid(), kind: 'draw', page: p.num, color: color.value, width: strokeWidth.value, points: [pt] }
    items.value.push(it)
    action = { type: 'draw', item: it, page: p, startX: pt.x, startY: pt.y, orig: { x: 0, y: 0, w: 0, h: 0 }, rect }
    bindWindow()
  }
}

const startMove = (it: EditorItem, p: PageInfo, e: PointerEvent) => {
  if (mode.value !== 'select') return
  const orig = it.kind === 'text'
    ? { x: it.x, y: it.y, w: 0, h: 0 }
    : { x: (it as RectItem).x, y: (it as RectItem).y, w: (it as RectItem).w, h: (it as RectItem).h }
  action = { type: 'move', item: it, page: p, startX: e.clientX, startY: e.clientY, orig, rect: null }
  bindWindow()
}

const startResize = (it: RectItem | ImageItem, p: PageInfo, e: PointerEvent) => {
  if (mode.value !== 'select') return
  action = { type: 'resize', item: it, page: p, startX: e.clientX, startY: e.clientY, orig: { x: it.x, y: it.y, w: it.w, h: it.h }, rect: null }
  bindWindow()
}

const onPointerMove = (e: PointerEvent) => {
  if (!action) return
  const { type, item, page, startX, startY, orig, rect } = action

  if (type === 'move') {
    const dx = (e.clientX - startX) / page.scale
    const dy = (e.clientY - startY) / page.scale
    if (item.kind === 'text') {
      const estW = Math.max(4, item.text.length + 2) * item.size * 0.55
      item.x = clamp(orig.x + dx, 0, page.ptWidth - estW * 0.5)
      item.y = clamp(orig.y + dy, 0, page.ptHeight - item.size)
    }
    else if (item.kind === 'rect' || item.kind === 'image') {
      item.x = clamp(orig.x + dx, 0, page.ptWidth - item.w)
      item.y = clamp(orig.y + dy, 0, page.ptHeight - item.h)
    }
    return
  }

  if (type === 'resize' && (item.kind === 'rect' || item.kind === 'image')) {
    const dx = (e.clientX - startX) / page.scale
    const dy = (e.clientY - startY) / page.scale
    if (item.kind === 'image') {
      // Keep aspect ratio.
      const ratio = item.src.natH / item.src.natW
      let w = clamp(orig.w + dx, 12, page.ptWidth - item.x)
      let h = w * ratio
      if (item.y + h > page.ptHeight) { h = page.ptHeight - item.y; w = h / ratio }
      item.w = w
      item.h = h
    }
    else {
      item.w = clamp(orig.w + dx, 4, page.ptWidth - item.x)
      item.h = clamp(orig.h + dy, 4, page.ptHeight - item.y)
    }
    return
  }

  if (type === 'rect-new' && item.kind === 'rect' && rect) {
    const pt = pagePoint(page, rect, e)
    item.x = Math.min(startX, pt.x)
    item.y = Math.min(startY, pt.y)
    item.w = Math.abs(pt.x - startX)
    item.h = Math.abs(pt.y - startY)
    return
  }

  if (type === 'draw' && item.kind === 'draw' && rect) {
    item.points.push(pagePoint(page, rect, e))
    redrawStrokes(page.num)
  }
}

const onPointerUp = () => {
  if (!action) return
  const { type, item, page } = action
  // Discard degenerate gestures (a stray click).
  if (type === 'rect-new' && item.kind === 'rect' && (item.w < 3 || item.h < 3)) removeItem(item)
  if (type === 'draw' && item.kind === 'draw' && item.points.length < 2) { removeItem(item); redrawStrokes(page.num) }
  action = null
  window.removeEventListener('pointermove', onPointerMove)
}

onBeforeUnmount(() => window.removeEventListener('pointermove', onPointerMove))

// ── Export ──

const hexToRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16)
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

const exportPdf = async () => {
  if (!origBytes) return
  error.value = ''
  busy.value = true
  try {
    const doc = await PDFDocument.load(origBytes, { ignoreEncryption: true })
    const font = await doc.embedFont(StandardFonts.Helvetica)
    const imgCache = new Map<PlacedImage, Awaited<ReturnType<typeof doc.embedPng>>>()

    for (const p of pages.value) {
      if (deletedPages.value.has(p.num)) continue
      const page = doc.getPage(p.num - 1)
      const pageH = page.getHeight()
      const pageItems = items.value.filter(i => i.page === p.num)

      // White-out first so everything else stays on top, matching the preview.
      for (const it of pageItems) {
        if (it.kind !== 'rect') continue
        page.drawRectangle({ x: it.x, y: pageH - it.y - it.h, width: it.w, height: it.h, color: rgb(1, 1, 1) })
      }

      for (const it of pageItems) {
        if (it.kind === 'text') {
          if (!it.text.trim()) continue
          page.drawText(it.text, {
            x: it.x,
            y: pageH - it.y - it.size * 0.85,
            size: it.size,
            font,
            color: hexToRgb(it.color),
          })
        }
        else if (it.kind === 'image') {
          let img = imgCache.get(it.src)
          if (!img) {
            img = it.src.format === 'jpg' ? await doc.embedJpg(it.src.bytes) : await doc.embedPng(it.src.bytes)
            imgCache.set(it.src, img)
          }
          page.drawImage(img, { x: it.x, y: pageH - it.y - it.h, width: it.w, height: it.h })
        }
        else if (it.kind === 'draw') {
          if (it.points.length < 2) continue
          const d = `M ${it.points.map(pt => `${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`).join(' L ')}`
          page.drawSvgPath(d, {
            x: 0,
            y: pageH,
            borderColor: hexToRgb(it.color),
            borderWidth: it.width,
            borderLineCap: LineCapStyle.Round,
          })
        }
      }
    }

    for (const n of [...deletedPages.value].sort((a, b) => b - a)) doc.removePage(n - 1)

    const out = await doc.save()
    downloadBlob(out, `${baseName(origName)}-breytt.pdf`, 'application/pdf')
  }
  catch (e) {
    console.error('[pdf-editor]', e)
    error.value = t('portal.tools.pdfEdit.failed')
  }
  finally {
    busy.value = false
  }
}

useHead({ title: 'PDF ritill · Hjálpartól · Portal' })
</script>
