<template>
  <section v-if="items.length" :aria-labelledby="headingId">
    <p v-if="kicker" class="kicker">{{ kicker }}</p>
    <h2 :id="headingId" class="h2 mt-3">{{ title }}</h2>
    <div class="mt-8 max-w-3xl divide-y divide-ink-700 border-y border-ink-700">
      <details
        v-for="(item, i) in items"
        :key="i"
        class="group"
        :open="i === 0 && openFirst"
      >
        <summary class="flex items-start justify-between gap-6 py-4 cursor-pointer list-none text-bone-100 font-medium [&::-webkit-details-marker]:hidden">
          <span>{{ item.q }}</span>
          <svg
            class="w-4 h-4 mt-1 shrink-0 text-gold-500 transition-transform group-open:rotate-45"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </summary>
        <p class="pb-5 pr-10 text-sm text-bone-400 leading-relaxed">{{ item.a }}</p>
      </details>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { FaqItem } from '~/composables/useFaq'

// Questions and answers live in the HTML (details/summary), so they count as
// page copy for search engines and screen readers alike. The matching
// schema.org Question nodes are emitted here; the HOST page declares
// `FAQPage` on its WebPage node (nuxt-schema-org attaches the questions as
// mainEntity), so this component never creates a second WebPage.
const props = withDefaults(defineProps<{
  title: string
  kicker?: string
  items: FaqItem[]
  openFirst?: boolean
}>(), {
  kicker: '',
  openFirst: false,
})

const headingId = useId()

useSchemaOrg(props.items.map(item => defineQuestion({
  name: item.q,
  acceptedAnswer: item.a,
})))
</script>
