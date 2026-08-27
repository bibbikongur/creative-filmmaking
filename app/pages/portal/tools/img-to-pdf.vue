<template>
  <PortalToolsShell :title="$t('portal.tools.imgToPdf.title')" :desc="$t('portal.tools.imgToPdf.long')">
    <PortalToolsDropzone
      v-model="files"
      accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
      multiple
      reorderable
      :hint="$t('portal.tools.imgToPdf.hint')"
    />

    <div class="mt-6">
      <label class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">{{ $t('portal.tools.imgToPdf.pageSize') }}</label>
      <select v-model="pageSize" class="input-dark max-w-xs">
        <option value="fit">{{ $t('portal.tools.imgToPdf.sizeFit') }}</option>
        <option value="a4">A4</option>
        <option value="letter">US Letter</option>
      </select>
    </div>

    <p v-if="error" class="mt-4 text-sm text-signal-500">{{ error }}</p>

    <button
      type="button"
      class="btn-gold mt-6 disabled:opacity-50"
      :disabled="!files.length || busy"
      @click="convert"
    >
      {{ busy ? $t('portal.tools.working') : $t('portal.tools.imgToPdf.action') }}
    </button>
  </PortalToolsShell>
</template>

<script setup lang="ts">
import { PDFDocument } from 'pdf-lib'

definePageMeta({ layout: 'portal' })
usePortalToolGuard('img-to-pdf')

const { t } = useI18n()

const files = ref<File[]>([])
const pageSize = ref<'fit' | 'a4' | 'letter'>('fit')
const busy = ref(false)
const error = ref('')

// Page dimensions in PDF points (72 dpi).
const PAGE_DIMS = { a4: [595.28, 841.89], letter: [612, 792] } as const

const convert = async () => {
  error.value = ''
  busy.value = true
  try {
    const doc = await PDFDocument.create()
    for (const file of files.value) {
      const bytes = new Uint8Array(await file.arrayBuffer())
      // pdf-lib embeds JPG and PNG directly; anything else (WebP) goes through canvas -> PNG.
      const isJpg = /jpe?g$/i.test(file.type) || /\.jpe?g$/i.test(file.name)
      const isPng = /png$/i.test(file.type) || /\.png$/i.test(file.name)
      const img = isJpg
        ? await doc.embedJpg(bytes)
        : isPng
          ? await doc.embedPng(bytes)
          : await doc.embedPng(await imageToPngBytes(file))

      if (pageSize.value === 'fit') {
        const page = doc.addPage([img.width, img.height])
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height })
      }
      else {
        const [pw, ph] = PAGE_DIMS[pageSize.value]
        const page = doc.addPage([pw, ph])
        const margin = 36 // 0.5 inch
        const scale = Math.min((pw - margin * 2) / img.width, (ph - margin * 2) / img.height, 1)
        const w = img.width * scale
        const h = img.height * scale
        page.drawImage(img, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h })
      }
    }
    const out = await doc.save()
    downloadBlob(out, 'myndir.pdf', 'application/pdf')
  }
  catch {
    error.value = t('portal.tools.imgToPdf.failed')
  }
  finally {
    busy.value = false
  }
}

useHead({ title: 'Mynd í PDF · Hjálpartól · Portal' })
</script>
