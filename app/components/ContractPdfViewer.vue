<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-100"
      leave-to-class="opacity-0"
    >
      <div v-if="src" class="fixed inset-0 z-[90] flex items-center justify-center p-2 sm:p-6">
        <div class="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" @mousedown="emit('close')" />
        <div
          class="relative flex h-full w-full max-w-5xl flex-col border border-ink-700 rail-top bg-ink-900"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
        >
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-ink-800 px-4 py-3">
            <p class="min-w-0 truncate text-sm font-semibold text-bone-100">{{ title }}</p>
            <div class="flex flex-wrap items-center gap-2">
              <a :href="src" target="_blank" class="btn-ghost !px-3 !py-1.5 !text-xs">Open in new tab ↗</a>
              <a :href="downloadHref" class="btn-ghost !px-3 !py-1.5 !text-xs">Download</a>
              <button ref="closeEl" type="button" class="btn-gold !px-4 !py-1.5 !text-xs" @click="emit('close')">Close</button>
            </div>
          </div>
          <!-- Phones often cannot show a PDF inside a page; the links above cover that. -->
          <iframe :key="src" :src="src" :title="title" class="min-h-0 w-full flex-1 bg-ink-950" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
/** In-page viewer for a contract PDF. Shown while `src` is set. */
const props = defineProps<{ src: string | null, title: string }>()
const emit = defineEmits<{ close: [] }>()

const closeEl = ref<HTMLButtonElement | null>(null)

const downloadHref = computed(() =>
  props.src ? `${props.src}${props.src.includes('?') ? '&' : '?'}download=1` : '')

// Lock page scroll while open and give focus back on close.
let restoreEl: HTMLElement | null = null
watch(() => props.src, async (src, prev) => {
  if (!import.meta.client) return
  if (src && !prev) {
    restoreEl = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'
    await nextTick()
    closeEl.value?.focus()
  }
  else if (!src) {
    document.body.style.overflow = ''
    restoreEl?.focus?.()
    restoreEl = null
  }
})

const onKey = (e: KeyboardEvent) => {
  if (props.src && e.key === 'Escape') {
    e.preventDefault()
    emit('close')
  }
}
onMounted(() => document.addEventListener('keydown', onKey))
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})
</script>
