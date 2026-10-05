<template>
  <nav class="flex flex-wrap gap-2" :aria-label="groupLabel">
    <NuxtLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="btn btn-sm border"
      :class="item.active
        ? 'bg-gold-500 text-ink-950 border-gold-500'
        : 'border-ink-700 text-bone-400 hover:border-gold-500 hover:text-bone-100'"
      :aria-current="item.active ? 'page' : undefined"
    >
      {{ item.label }}
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
export interface CategoryLink {
  label: string
  to: string
  active?: boolean
}

// Pill row of real links between the catalogue hub and its category landing
// pages. Links (not buttons) so every category view has its own crawlable URL.
defineProps<{
  items: CategoryLink[]
  groupLabel: string
}>()
</script>
