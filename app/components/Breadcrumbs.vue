<template>
  <nav :aria-label="t('breadcrumbs.label')" class="text-xs uppercase tracking-widest text-bone-400">
    <ol class="flex flex-wrap items-center gap-y-1">
      <li v-for="(item, i) in items" :key="i" class="flex items-center">
        <span v-if="i > 0" class="mx-2 text-ink-400" aria-hidden="true">/</span>
        <NuxtLink
          v-if="item.to && i < items.length - 1"
          :to="item.to"
          class="hover:text-gold-400 transition-colors"
        >
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
const props = defineProps<{ items: BreadcrumbItem[] }>()

const { t } = useI18n()

useSchemaOrg([
  defineBreadcrumb({
    itemListElement: props.items.map(item => ({
      name: item.label,
      ...(item.to ? { item: item.to } : {}),
    })),
  }),
])
</script>
