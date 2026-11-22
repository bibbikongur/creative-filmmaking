<template>
  <!-- An equipment item's key points (it has no spec table, so its figures live
       here). In the rail: a ruled list. `wide`, across the column under the photos:
       a titled section of its own, two across, like a vehicle's highlights. -->
  <section v-if="wide" class="pt-8 border-t border-ink-700" :aria-labelledby="headingId">
    <h2 :id="headingId" class="h3">{{ t('vehicle.highlightsTitle') }}</h2>
    <ul class="mt-5 grid gap-x-10 gap-y-3 sm:grid-cols-2">
      <li v-for="(h, i) in items" :key="i" class="flex items-start gap-3 text-[15px] leading-relaxed text-bone-100/85">
        <svg class="w-4 h-4 mt-1 shrink-0 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        {{ keepUnits(h) }}
      </li>
    </ul>
  </section>
  <ul v-else class="border-y border-ink-700 divide-y divide-ink-700" :aria-label="t('vehicle.highlightsTitle')">
    <li v-for="(h, i) in items" :key="i" class="flex items-start gap-3 py-2.5 text-sm leading-relaxed text-bone-100">
      <svg class="w-4 h-4 mt-1 shrink-0 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      {{ keepUnits(h) }}
    </li>
  </ul>
</template>

<script setup lang="ts">
defineProps<{ items: string[], wide?: boolean }>()

const { t } = useI18n()
const headingId = useId()
</script>
