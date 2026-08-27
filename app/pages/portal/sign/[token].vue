<template>
  <div class="max-w-3xl mx-auto">
    <p v-if="loading" class="text-center py-20 text-bone-400">{{ $t('portal.loading') }}</p>

    <div v-else-if="invalid" class="border border-signal-500/50 bg-signal-500/10 p-6 text-sm leading-relaxed">
      <p class="font-semibold text-signal-500">{{ $t('portal.sign.invalidTitle') }}</p>
      <p class="mt-2 text-bone-400">{{ $t('portal.sign.invalidBody') }}</p>
    </div>

    <div v-else-if="done" class="border border-emerald-600/50 bg-emerald-600/10 p-6 text-sm leading-relaxed">
      <p class="font-semibold text-emerald-400">{{ $t('portal.sign.doneTitle') }}</p>
      <p class="mt-2 text-bone-400">{{ $t('portal.sign.doneBody') }}</p>
    </div>

    <div v-else-if="declined" class="border border-ink-700 bg-ink-900/50 p-6 text-sm leading-relaxed">
      <p class="font-semibold text-bone-100">{{ $t('portal.sign.declinedTitle') }}</p>
      <p class="mt-2 text-bone-400">{{ $t('portal.sign.declinedBody') }}</p>
    </div>

    <template v-else-if="data">
      <div class="text-center">
        <p class="kicker">{{ data.companyName }}</p>
        <h1 class="mt-2 text-2xl font-semibold uppercase tracking-wide text-bone-100">
          {{ $t(`portal.docs.${data.kind}`) }} · {{ data.jobName }}
        </h1>
        <p class="mt-3 text-sm text-bone-400">{{ $t('portal.sign.intro') }}</p>
      </div>

      <!-- Document preview with the filled values overlaid -->
      <div ref="pagesEl" class="mt-8 space-y-4">
        <div v-for="p in pages" :key="p.num" class="mx-auto" :style="{ width: `${p.cssWidth}px` }">
          <div class="relative" :style="{ width: `${p.cssWidth}px`, height: `${p.cssHeight}px` }">
            <canvas :ref="el => setCanvas(p.num, el as HTMLCanvasElement | null)" class="absolute inset-0" />
            <div
              v-for="f in fieldsOnPage(p.num)"
              :key="f.id"
              class="absolute overflow-hidden flex items-center"
              :class="f.type === 'signature'
                ? 'border-2 border-dashed border-gold-500/80 bg-gold-500/10'
                : ''"
              :style="{
                left: `${f.x * p.scale}px`,
                top: `${f.y * p.scale}px`,
                width: `${f.w * p.scale}px`,
                height: `${f.h * p.scale}px`,
              }"
            >
              <span
                v-if="f.type === 'signature'"
                class="px-1 mx-auto text-[10px] uppercase tracking-wider text-gold-600"
              >{{ $t('portal.sign.yourSignature') }}</span>
              <span
                v-else
                class="px-0.5 text-ink-950 whitespace-nowrap"
                :style="{ fontSize: `${Math.min(9, Math.max(6, f.h * 0.6)) * p.scale}px` }"
              >{{ fieldText(f) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Sign -->
      <form class="mt-8 border border-ink-800 bg-ink-900/50 p-5 space-y-5" @submit.prevent="submit">
        <div>
          <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.sign.typedName') }}</label>
          <input v-model="name" type="text" autocomplete="name" class="input-dark" required>
        </div>
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="block text-xs uppercase tracking-widest text-bone-400">{{ $t('portal.sign.draw') }}</label>
            <button type="button" class="text-xs uppercase tracking-widest text-bone-400 hover:text-gold-400 transition-colors" @click="clearSignature">
              {{ $t('portal.sign.clear') }}
            </button>
          </div>
          <canvas
            ref="sigEl"
            class="w-full h-40 bg-bone-100 touch-none cursor-crosshair rounded-sm"
            @pointerdown="sigStart"
            @pointermove="sigMove"
            @pointerup="sigEnd"
            @pointerleave="sigEnd"
          />
        </div>
        <p class="text-xs text-bone-400">{{ $t('portal.sign.consent') }}</p>
        <ul v-if="errors.length" class="text-sm text-signal-500 list-disc pl-5">
          <li v-for="err in errors" :key="err">{{ err }}</li>
        </ul>
        <div class="flex flex-wrap items-center gap-4">
          <button type="submit" class="btn-gold disabled:opacity-60" :disabled="submitting || !name.trim() || !hasDrawn">
            {{ submitting ? '…' : $t('portal.sign.submit') }}
          </button>
          <button
            type="button"
            class="text-xs uppercase tracking-widest text-signal-500/80 hover:text-signal-500 transition-colors"
            :disabled="submitting"
            @click="decline"
          >
            {{ $t('portal.sign.decline') }}
          </button>
        </div>
      </form>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { DocKind, LocaleCode, TemplateField } from '~/types'

definePageMeta({ layout: 'portal', portalPublic: true })

interface SignData {
  kind: DocKind
  jobName: string
  companyName: string
  memberName: string
  locale: LocaleCode
  fields: TemplateField[]
  values: { name: string, role: string, email: string, phone: string, dayRate: number, sentDate: string }
}

interface PageInfo { num: number, scale: number, cssWidth: number, cssHeight: number }

const route = useRoute()
const { t } = useI18n()
const { confirmDialog } = useAppDialog()
const token = String(route.params.token)

const data = ref<SignData | null>(null)
const pages = ref<PageInfo[]>([])
const loading = ref(true)
const invalid = ref(false)
const done = ref(false)
const declined = ref(false)
const name = ref('')
const errors = ref<string[]>([])
const submitting = ref(false)
const hasDrawn = ref(false)
const pagesEl = ref<HTMLElement | null>(null)
const sigEl = ref<HTMLCanvasElement | null>(null)

const canvases = new Map<number, HTMLCanvasElement>()
const setCanvas = (num: number, el: HTMLCanvasElement | null) => {
  if (el) canvases.set(num, el)
}

const fieldsOnPage = (page: number) => data.value?.fields.filter(f => f.page === page) ?? []

const fieldText = (f: TemplateField): string => {
  const v = data.value!.values
  switch (f.type) {
    case 'name': return v.name
    case 'role': return v.role
    case 'email': return v.email
    case 'phone': return v.phone
    case 'dayRate': return `${v.dayRate.toLocaleString('is-IS')} kr.`
    case 'date': return v.sentDate
    case 'dateSigned': return '' // stamped at signing time
    default: return ''
  }
}

onMounted(async () => {
  try {
    const [res, pdfData, pdfjs] = await Promise.all([
      $fetch<SignData>(`/api/portal/sign/${token}`),
      $fetch<ArrayBuffer>(`/api/portal/sign/${token}/file`, { responseType: 'arrayBuffer' }),
      import('pdfjs-dist'),
    ])
    data.value = res
    name.value = res.memberName

    pdfjs.GlobalWorkerOptions.workerSrc
      = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
    const doc = await pdfjs.getDocument({ data: pdfData }).promise
    const containerWidth = Math.min(720, pagesEl.value?.clientWidth ?? window.innerWidth - 32)

    const infos: PageInfo[] = []
    for (let num = 1; num <= doc.numPages; num++) {
      const page = await doc.getPage(num)
      const base = page.getViewport({ scale: 1 })
      const scale = containerWidth / base.width
      infos.push({ num, scale, cssWidth: Math.round(base.width * scale), cssHeight: Math.round(base.height * scale) })
    }
    pages.value = infos
    loading.value = false

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
    initSignatureCanvas()
  }
  catch (e) {
    console.error('[sign]', e)
    invalid.value = true
    loading.value = false
  }
})

// ── Signature drawing ──

let sigCtx: CanvasRenderingContext2D | null = null
let drawing = false

const initSignatureCanvas = () => {
  const canvas = sigEl.value
  if (!canvas) return
  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  sigCtx = canvas.getContext('2d')
  if (sigCtx) {
    sigCtx.scale(dpr, dpr)
    sigCtx.lineWidth = 2.2
    sigCtx.lineCap = 'round'
    sigCtx.lineJoin = 'round'
    sigCtx.strokeStyle = '#1a1a58'
  }
}

const sigPoint = (e: PointerEvent) => {
  const rect = sigEl.value!.getBoundingClientRect()
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

const sigStart = (e: PointerEvent) => {
  if (!sigCtx) return
  drawing = true
  sigEl.value!.setPointerCapture(e.pointerId)
  const p = sigPoint(e)
  sigCtx.beginPath()
  sigCtx.moveTo(p.x, p.y)
}

const sigMove = (e: PointerEvent) => {
  if (!drawing || !sigCtx) return
  const p = sigPoint(e)
  sigCtx.lineTo(p.x, p.y)
  sigCtx.stroke()
  hasDrawn.value = true
}

const sigEnd = () => {
  drawing = false
}

const clearSignature = () => {
  const canvas = sigEl.value
  if (!canvas || !sigCtx) return
  sigCtx.clearRect(0, 0, canvas.width, canvas.height)
  hasDrawn.value = false
}

// ── Submit ──

const submit = async () => {
  errors.value = []
  submitting.value = true
  try {
    await $fetch(`/api/portal/sign/${token}/sign`, {
      method: 'POST',
      body: { name: name.value, signature: sigEl.value!.toDataURL('image/png') },
    })
    done.value = true
  }
  catch (e: any) {
    errors.value = e?.data?.data?.errors || [e?.data?.statusMessage || t('portal.loadFailed')]
  }
  finally {
    submitting.value = false
  }
}

const decline = async () => {
  if (!await confirmDialog(t('portal.sign.declineConfirm'))) return
  submitting.value = true
  try {
    await $fetch(`/api/portal/sign/${token}/decline`, { method: 'POST' })
    declined.value = true
  }
  catch (e: any) {
    errors.value = [e?.data?.statusMessage || t('portal.loadFailed')]
  }
  finally {
    submitting.value = false
  }
}

useHead({ title: 'Sign · Creative Filmmaking' })
</script>
