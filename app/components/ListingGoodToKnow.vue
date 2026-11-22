<template>
  <!-- The practical questions a page without a price has to answer before anyone
       asks for a quote: collection and delivery, notice, insurance and terms. The
       answers are the site's own FAQ answers (faq.home), so they are written once.
       No schema.org Question nodes here: the FAQ pages carry those. -->
  <section v-if="items.length" :aria-labelledby="headingId">
    <h2 :id="headingId" class="h3">{{ t('listing.goodToKnow') }}</h2>
    <div class="mt-5 divide-y divide-ink-700 border-y border-ink-700">
      <!-- The first answer (where to collect, and delivery) is open: the address is in plain view -->
      <details v-for="(item, i) in items" :key="i" class="group" :open="i === 0">
        <summary class="flex items-start justify-between gap-6 py-3.5 cursor-pointer list-none text-[15px] font-medium text-bone-100 [&::-webkit-details-marker]:hidden">
          <span>{{ item.q }}</span>
          <svg class="w-4 h-4 mt-1 shrink-0 text-gold-500 transition-transform group-open:rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </summary>
        <p class="pb-4 pr-10 max-w-[68ch] text-sm text-bone-400 leading-relaxed">{{ item.a }}</p>
      </details>
    </div>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{ type: 'vehicle' | 'equipment' }>()

const { t } = useI18n()
const { faq } = useFaq()
const headingId = useId()

// Positions in faq.home (both locale files keep the same order): collection and
// delivery, notice, insurance and terms, who can rent, and for equipment whether
// it rents without a vehicle. A question that is no longer there is skipped.
const PICKS = { vehicle: [3, 4, 5, 2], equipment: [3, 4, 5, 6] } as const
const items = computed(() => {
  const all = faq('faq.home')
  return PICKS[props.type].map(i => all[i]).filter((item): item is NonNullable<typeof item> => Boolean(item))
})
</script>
