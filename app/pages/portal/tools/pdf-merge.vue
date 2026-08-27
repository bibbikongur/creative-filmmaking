<template>
  <PortalToolsShell :title="$t('portal.tools.pdfMerge.title')" :desc="$t('portal.tools.pdfMerge.long')">
    <PortalToolsDropzone
      v-model="files"
      accept="application/pdf,.pdf"
      multiple
      reorderable
      :hint="$t('portal.tools.pdfMerge.hint')"
    />

    <p v-if="error" class="mt-4 text-sm text-signal-500">{{ error }}</p>

    <button
      type="button"
      class="btn-gold mt-6 disabled:opacity-50"
      :disabled="files.length < 2 || busy"
      @click="merge"
    >
      {{ busy ? $t('portal.tools.working') : $t('portal.tools.pdfMerge.action') }}
    </button>
  </PortalToolsShell>
</template>

<script setup lang="ts">
import { PDFDocument } from 'pdf-lib'

definePageMeta({ layout: 'portal' })
usePortalToolGuard('pdf-merge')

const { t } = useI18n()

const files = ref<File[]>([])
const busy = ref(false)
const error = ref('')

const merge = async () => {
  error.value = ''
  busy.value = true
  try {
    const out = await PDFDocument.create()
    for (const file of files.value) {
      const bytes = await file.arrayBuffer()
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true })
      const pages = await out.copyPages(doc, doc.getPageIndices())
      pages.forEach(p => out.addPage(p))
    }
    const merged = await out.save()
    downloadBlob(merged, 'sameinad.pdf', 'application/pdf')
  }
  catch {
    error.value = t('portal.tools.pdfMerge.failed')
  }
  finally {
    busy.value = false
  }
}

useHead({ title: 'PDF · Hjálpartól · Portal' })
</script>
