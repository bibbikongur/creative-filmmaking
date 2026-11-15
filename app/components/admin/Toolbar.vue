<template>
  <div class="flex flex-wrap items-center gap-3">
    <!-- Filters (pills) come first, on the left -->
    <div v-if="$slots.default" class="flex flex-wrap items-center gap-2">
      <slot />
    </div>

    <label v-if="search !== undefined" class="relative flex-1 min-w-[12rem] sm:max-w-xs" :class="$slots.default ? 'sm:ml-auto' : ''">
      <span class="sr-only">{{ placeholder }}</span>
      <AdminIcon name="search" :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
      <input
        :value="search"
        type="search"
        class="admin-field w-full !pl-9"
        :placeholder="placeholder"
        @input="$emit('update:search', ($event.target as HTMLInputElement).value)"
      >
    </label>

    <slot name="end" />

    <p v-if="count" class="text-xs text-ink-400 tabular-nums" :class="search === undefined && !$slots.default ? '' : 'ml-auto sm:ml-0'" aria-live="polite">
      {{ count }}
    </p>
  </div>
</template>

<script setup lang="ts">
// Filter row above a list: filter pills, a search box, extra controls, and a result count.
withDefaults(defineProps<{
  search?: string
  placeholder?: string
  count?: string
}>(), { search: undefined, placeholder: 'Search…', count: '' })

defineEmits<{ 'update:search': [value: string] }>()
</script>
