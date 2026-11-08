<template>
  <span v-if="!amounts.ISK && !amounts.EUR" class="text-bone-400/60">–</span>
  <span v-else class="inline-flex flex-col items-end leading-tight">
    <span v-if="amounts.ISK">{{ amounts.ISK.toLocaleString('is-IS') }} kr.</span>
    <span v-if="amounts.EUR">€{{ amounts.EUR.toLocaleString('en-US') }}</span>
  </span>
</template>

<script setup lang="ts">
import type { OfferCurrency } from '~/types'

// Per-currency amount stack. Offers are either ISK or EUR and the exchange
// rate is not stored, so the two are shown side by side instead of summed.
defineProps<{ amounts: Record<OfferCurrency, number> }>()
</script>
