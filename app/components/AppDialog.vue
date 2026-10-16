<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-100"
      leave-to-class="opacity-0"
    >
      <div v-if="state.open" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" @mousedown="cancel" />
        <div
          ref="panelEl"
          class="relative w-full max-w-md border border-ink-700 rail-top bg-ink-900 p-6"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="`${uid}-title`"
          :aria-describedby="`${uid}-message`"
        >
          <p :id="`${uid}-title`" class="kicker">Creative Filmmaking</p>
          <p :id="`${uid}-message`" class="mt-3 text-sm leading-relaxed text-bone-100 whitespace-pre-line">{{ state.message }}</p>
          <input
            v-if="state.kind === 'prompt'"
            ref="inputEl"
            v-model="state.input"
            type="text"
            class="input-dark mt-4 w-full"
            @keydown.enter.prevent="ok"
          >
          <div class="mt-6 flex justify-end gap-3">
            <button v-if="state.kind !== 'alert'" type="button" class="btn-outline" @click="cancel">
              {{ $t('portal.cancel') }}
            </button>
            <button ref="okEl" type="button" class="btn-gold" @click="ok">
              {{ $t('portal.dialog.ok') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const { state, settle } = useAppDialog()
const uid = useId()

const panelEl = ref<HTMLElement | null>(null)
const inputEl = ref<HTMLInputElement | null>(null)
const okEl = ref<HTMLButtonElement | null>(null)

const ok = () => settle(state.kind === 'confirm' ? true : state.kind === 'prompt' ? state.input : undefined)
const cancel = () => settle(state.kind === 'confirm' ? false : state.kind === 'prompt' ? null : undefined)

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Remember what had focus, lock page scroll while open, give focus back on close.
let restoreEl: HTMLElement | null = null
watch(() => state.open, async (open) => {
  if (!import.meta.client) return
  if (open) {
    restoreEl = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'
    await nextTick()
    if (state.kind === 'prompt') inputEl.value?.select()
    else okEl.value?.focus()
  }
  else {
    document.body.style.overflow = ''
    restoreEl?.focus?.()
    restoreEl = null
  }
})

const onKey = (e: KeyboardEvent) => {
  if (!state.open) return
  if (e.key === 'Escape') {
    e.preventDefault()
    cancel()
    return
  }
  // Keep Tab inside the panel
  if (e.key === 'Tab' && panelEl.value) {
    const nodes = Array.from(panelEl.value.querySelectorAll<HTMLElement>(FOCUSABLE))
    if (!nodes.length) return
    const first = nodes[0]!
    const last = nodes[nodes.length - 1]!
    const active = document.activeElement
    if (e.shiftKey && (active === first || !panelEl.value.contains(active))) {
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
