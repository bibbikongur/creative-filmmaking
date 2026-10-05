<template>
  <NuxtLink
    :to="localePath('/cart')"
    class="relative p-2 text-bone-400 hover:text-bone-100 transition-colors"
    :aria-label="cart.count.value ? `${t('cart.title')} (${cart.count.value})` : t('cart.title')"
  >
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
    <span
      v-if="cart.count.value"
      class="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] px-1 flex items-center justify-center bg-gold-500 text-ink-950 text-[11px] font-semibold rounded-full"
      aria-hidden="true"
    >
      {{ cart.count.value }}
    </span>
  </NuxtLink>
</template>

<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const cart = useCart()
</script>
