<template>
  <!-- The quote list as it sits in a catalogue rail: what is on it and the one
       way forward; while it is empty, how it works and who to ask instead. -->
  <div>
  <!-- Quote list: what is on it, and the one way forward -->
  <section class="border border-ink-700 bg-ink-900 p-4" :class="cart.count.value ? 'rail-top' : ''" :aria-label="t('equipmentCatalogue.browser.listTitle')">
    <div class="flex items-baseline justify-between gap-3">
      <p class="h4">{{ t('equipmentCatalogue.browser.listTitle') }}</p>
      <span v-if="cart.count.value" class="text-xs tabular-nums text-bone-400" aria-live="polite">
        {{ t('equipmentCatalogue.browser.listCount', { n: cart.count.value }, cart.count.value) }}
      </span>
    </div>
    <template v-if="cart.count.value">
      <QuoteListMini class="mt-2 max-h-[13.5rem] overflow-y-auto pr-2 -mr-2" />
      <NuxtLink :to="localePath('/cart')" class="btn-gold btn-sm w-full mt-3">
        {{ t('equipmentCatalogue.browser.listCta') }}
      </NuxtLink>
    </template>
    <p v-else class="mt-2 text-[13px] leading-relaxed text-bone-400">
      {{ emptyText || t('equipmentCatalogue.browser.listEmpty') }}
    </p>
  </section>

  <!-- One quiet line, not a second box -->
  <p class="mt-3 px-1 text-[13px] leading-relaxed text-bone-400">
    {{ t('equipmentCatalogue.browser.helpTitle') }}
    <NuxtLink :to="localePath('/contact')" class="font-medium text-bone-100 underline decoration-ink-500 underline-offset-4 hover:text-gold-400 hover:decoration-gold-500 transition-colors whitespace-nowrap">{{ t('nav.contact') }}</NuxtLink>
  </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  /** What to say while the list is empty (defaults to the equipment wording) */
  emptyText?: string
}>()

const { t } = useI18n()
const localePath = useLocalePath()
const cart = useCart()
</script>
