<template>
  <div>
  <!-- Quote list on small screens: a bar that appears once something is on the
       list; the count opens the list itself, the button sends it. -->
  <Transition enter-active-class="transition-opacity duration-150" enter-from-class="opacity-0" leave-active-class="transition-opacity duration-100" leave-to-class="opacity-0">
    <div v-if="sheetOpen && cart.count.value" class="fixed inset-0 z-[55] lg:hidden bg-ink-950/75" aria-hidden="true" @click="sheetOpen = false" />
  </Transition>
  <Transition
    enter-active-class="transition duration-150 ease-out"
    enter-from-class="translate-y-full"
    leave-active-class="transition duration-100 ease-in"
    leave-to-class="translate-y-full"
  >
    <div
      v-if="cart.count.value"
      class="fixed bottom-0 inset-x-0 z-[60] lg:hidden bg-ink-900 border-t-2 border-gold-500 shadow-[0_-12px_24px_-12px_rgba(0,0,0,0.7)]"
      @keydown.esc="sheetOpen = false"
    >
      <div v-if="sheetOpen" id="quote-sheet" class="px-4 pt-2 max-h-[60vh] overflow-y-auto border-b border-ink-700">
        <div class="sticky top-0 -mx-4 px-4 flex items-center justify-between gap-3 bg-ink-900">
          <p class="h4">
            {{ t('equipmentCatalogue.browser.listTitle') }}
            <span class="ml-2 font-sans text-xs font-normal normal-case tracking-normal text-gold-400">{{ t('equipmentCatalogue.browser.listCount', { n: cart.count.value }, cart.count.value) }}</span>
          </p>
          <button
            type="button"
            class="-mr-3 h-11 w-11 inline-flex items-center justify-center text-bone-400 hover:text-bone-100"
            :aria-label="t('equipmentCatalogue.browser.listHide')"
            @click="sheetOpen = false"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <QuoteListMini touch />
      </div>
      <div class="flex items-center justify-between gap-3 px-4 py-2.5">
        <button
          type="button"
          class="min-h-[2.75rem] inline-flex items-center gap-2 text-sm font-medium text-bone-100"
          :aria-expanded="sheetOpen"
          aria-controls="quote-sheet"
          :aria-label="`${t('equipmentCatalogue.browser.listCount', { n: cart.count.value }, cart.count.value)}. ${sheetOpen ? t('equipmentCatalogue.browser.listHide') : t('equipmentCatalogue.browser.listShow')}`"
          @click="sheetOpen = !sheetOpen"
        >
          <span class="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 bg-gold-500 text-ink-950 text-xs font-semibold tabular-nums">{{ cart.count.value }}</span>
          {{ t('equipmentCatalogue.browser.listTitle') }}
          <svg class="w-4 h-4 text-bone-400 transition-transform" :class="sheetOpen ? '' : 'rotate-180'" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <NuxtLink :to="localePath('/cart')" class="btn-gold btn-sm min-h-[2.75rem] shrink-0">
          {{ t('equipmentCatalogue.browser.listCtaShort') }}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </NuxtLink>
      </div>
    </div>
  </Transition>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const cart = useCart()

const sheetOpen = ref(false)
watch(() => cart.count.value, (n) => {
  if (!n) sheetOpen.value = false
})
</script>
