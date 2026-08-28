<template>
  <!-- Client-mounted only: SSR knows nothing about the stored choice, and a
       flash-then-hide for returning visitors would be worse than a tick of
       delay for new ones. -->
  <Transition name="consent">
    <div
      v-if="visible"
      class="fixed bottom-0 inset-x-0 z-50 bg-ink-900/95 backdrop-blur border-t border-ink-700"
      role="dialog"
      aria-live="polite"
      :aria-label="t('consent.text')"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <p class="flex-1 text-sm text-bone-400 leading-relaxed">
          {{ t('consent.text') }}
        </p>
        <div class="flex items-center gap-3 shrink-0">
          <button type="button" class="btn-gold !px-5 !py-2 text-sm" @click="choose(true)">
            {{ t('consent.accept') }}
          </button>
          <button
            type="button"
            class="px-5 py-2 text-sm font-heading font-semibold uppercase tracking-wider border border-bone-400/40 text-bone-400 hover:border-bone-400 hover:text-bone-100 transition-colors"
            @click="choose(false)"
          >
            {{ t('consent.decline') }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { CONSENT_KEY } from '~/plugins/gtag.client'

const { t } = useI18n()
const { $gaConsent } = useNuxtApp()
const gaId = useRuntimeConfig().public.gaId

const visible = ref(false)

onMounted(() => {
  if (!gaId) return // no analytics configured — nothing to consent to
  try {
    visible.value = localStorage.getItem(CONSENT_KEY) === null
  }
  catch {
    visible.value = false
  }
})

const choose = (granted: boolean) => {
  $gaConsent(granted)
  visible.value = false
}
</script>

<style scoped>
.consent-enter-active,
.consent-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.consent-enter-from,
.consent-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
