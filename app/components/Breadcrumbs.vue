<template>
  <nav :aria-label="t('breadcrumbs.label')" class="text-xs uppercase tracking-widest text-bone-400">
    <ol class="flex flex-wrap items-center gap-y-1">
      <!-- With `collapse`, a phone shows the step up only ("‹ Box trucks"): the whole
           trail would wrap over two or three lines above the photo. The full list
           stays in the HTML for screen readers and wider screens. -->
      <li
        v-for="(item, i) in items"
        :key="i"
        class="flex items-center"
        :class="collapse && i !== parentIndex ? 'max-sm:sr-only' : ''"
      >
        <span v-if="i > 0" class="mx-2 text-ink-400" :class="collapse ? 'max-sm:hidden' : ''" aria-hidden="true">/</span>
        <NuxtLink
          v-if="item.to && i < items.length - 1"
          :to="item.to"
          class="hover:text-gold-400 transition-colors"
          :class="collapse && i === parentIndex ? 'max-sm:inline-flex max-sm:items-center max-sm:gap-2 max-sm:min-h-[2.75rem] max-sm:-my-3 max-sm:text-bone-100' : ''"
        >
          <svg v-if="collapse && i === parentIndex" class="sm:hidden w-3.5 h-3.5 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
          </svg>
          {{ item.label }}
        </NuxtLink>
        <span v-else class="text-gold-500" aria-current="page">{{ item.label }}</span>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
export interface BreadcrumbItem {
  label: string
  /** Localized path (run through localePath by the caller). Last item may omit it. */
  to?: string
}

// One array drives both the visible trail and the BreadcrumbList JSON-LD, so
// the markup Google sees can never disagree with the structured data.
const props = defineProps<{
  items: BreadcrumbItem[]
  /** Phones show only the level above the page, as a back link */
  collapse?: boolean
}>()

const { t } = useI18n()

const parentIndex = computed(() => props.items.length - 2)

useSchemaOrg([
  defineBreadcrumb({
    itemListElement: props.items.map(item => ({
      name: item.label,
      ...(item.to ? { item: item.to } : {}),
    })),
  }),
])
</script>
