<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="index !== null"
        ref="rootEl"
        class="fixed inset-0 z-[90] flex flex-col bg-ink-950/95 backdrop-blur"
        role="dialog"
        aria-modal="true"
        :aria-label="alt"
        @click.self="close"
      >
        <!-- Top bar -->
        <div class="flex items-center justify-between gap-4 px-4 sm:px-6 h-16 shrink-0">
          <p class="meta tabular-nums">{{ index + 1 }} / {{ images.length }}</p>
          <button ref="closeEl" type="button" class="btn-outline btn-sm" @click="close">
            {{ t('common.close') }}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Stage -->
        <div class="relative flex-1 min-h-0 flex items-center justify-center px-4 pb-4 sm:px-16" @click.self="close">
          <div
            class="relative max-w-full max-h-full"
            :class="fit === 'contain' ? 'bg-product-well p-4 sm:p-8' : ''"
          >
            <NuxtImg
              :key="index"
              :src="images[index]!"
              :provider="imgProvider(images[index]!)"
              :alt="`${alt} (${index + 1}/${images.length})`"
              class="block max-w-full max-h-[calc(100svh-6rem)] w-auto h-auto object-contain"
              sizes="xs:100vw sm:100vw md:100vw lg:100vw xl:100vw xxl:100vw"
            />
          </div>

          <template v-if="images.length > 1">
            <button
              type="button"
              class="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-3 bg-ink-950/60 backdrop-blur text-bone-100 hover:text-gold-400 transition-colors"
              :aria-label="t('common.prevImage')"
              @click="step(-1)"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              class="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-3 bg-ink-950/60 backdrop-blur text-bone-100 hover:text-gold-400 transition-colors"
              :aria-label="t('common.nextImage')"
              @click="step(1)"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  images: string[]
  alt: string
  fit?: 'cover' | 'contain'
  /** Index of the open image, or null when closed */
  index: number | null
}>(), { fit: 'cover' })

const emit = defineEmits<{ 'update:index': [value: number | null] }>()

const { t } = useI18n()
const rootEl = ref<HTMLElement | null>(null)
const closeEl = ref<HTMLButtonElement | null>(null)

const close = () => emit('update:index', null)
const step = (dir: number) => {
  if (props.index === null) return
  emit('update:index', (props.index + dir + props.images.length) % props.images.length)
}

const FOCUSABLE = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'

let restoreEl: HTMLElement | null = null
watch(() => props.index !== null, async (open) => {
  if (!import.meta.client) return
  if (open) {
    restoreEl = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'
    await nextTick()
    closeEl.value?.focus()
  }
  else {
    document.body.style.overflow = ''
    restoreEl?.focus?.()
    restoreEl = null
  }
})

const onKey = (e: KeyboardEvent) => {
  if (props.index === null) return
  if (e.key === 'Escape') {
    e.preventDefault()
    close()
  }
  else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    step(-1)
  }
  else if (e.key === 'ArrowRight') {
    e.preventDefault()
    step(1)
  }
  else if (e.key === 'Tab' && rootEl.value) {
    const nodes = Array.from(rootEl.value.querySelectorAll<HTMLElement>(FOCUSABLE))
    if (!nodes.length) return
    const first = nodes[0]!
    const last = nodes[nodes.length - 1]!
    const active = document.activeElement
    if (e.shiftKey && (active === first || !rootEl.value.contains(active))) {
      e.preventDefault()
      last.focus()
    }
    else if (!e.shiftKey && active === last) {
      e.preventDefault()
      first.focus()
    }
  }
}
onMounted(() => document.addEventListener('keydown', onKey))
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})
</script>
