<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-100"
      leave-to-class="opacity-0"
    >
      <div v-if="state.open" class="fixed inset-0 z-[100] flex items-center justify-center p-4" @keydown.esc="cancel">
        <div class="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" @mousedown="cancel" />
        <div class="relative w-full max-w-md border border-ink-700 border-t-2 border-t-gold-500 bg-ink-900 p-6 shadow-2xl">
          <p class="kicker">Creative Filmmaking</p>
          <p class="mt-3 text-sm leading-relaxed text-bone-100 whitespace-pre-line">{{ state.message }}</p>
          <input
            v-if="state.kind === 'prompt'"
            ref="inputEl"
            v-model="state.input"
            type="text"
            class="input-dark mt-4 w-full"
            @keydown.enter.prevent="ok"
          >
          <div class="mt-6 flex justify-end gap-3">
            <button v-if="state.kind !== 'alert'" type="button" class="btn-ghost" @click="cancel">
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

const inputEl = ref<HTMLInputElement | null>(null)
const okEl = ref<HTMLButtonElement | null>(null)

const ok = () => settle(state.kind === 'confirm' ? true : state.kind === 'prompt' ? state.input : undefined)
const cancel = () => settle(state.kind === 'confirm' ? false : state.kind === 'prompt' ? null : undefined)

// Focus the input (prompt) or the OK button so Enter/Esc work right away.
watch(() => state.open, async (open) => {
  if (!open) return
  await nextTick()
  if (state.kind === 'prompt') inputEl.value?.select()
  else okEl.value?.focus()
})

const onKey = (e: KeyboardEvent) => {
  if (!state.open) return
  if (e.key === 'Escape') { e.preventDefault(); cancel() }
}
onMounted(() => document.addEventListener('keydown', onKey))
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
</script>
