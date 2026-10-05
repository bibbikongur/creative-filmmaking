<template>
  <div class="flex flex-wrap gap-2" role="group" :aria-label="groupLabel">
    <button
      type="button"
      class="btn btn-sm border"
      :class="!modelValue
        ? 'bg-gold-500 text-ink-950 border-gold-500'
        : 'border-ink-700 text-bone-400 hover:border-gold-500 hover:text-bone-100'"
      :aria-pressed="!modelValue"
      @click="emit('update:modelValue', null)"
    >
      {{ allLabel }}
    </button>
    <button
      v-for="c in options"
      :key="c"
      type="button"
      class="btn btn-sm border"
      :class="modelValue === c
        ? 'bg-gold-500 text-ink-950 border-gold-500'
        : 'border-ink-700 text-bone-400 hover:border-gold-500 hover:text-bone-100'"
      :aria-pressed="modelValue === c"
      @click="emit('update:modelValue', c)"
    >
      {{ label(c) }}
    </button>
  </div>
</template>

<script setup lang="ts" generic="T extends string">
// One pill row for both catalogues. The caller passes the categories that
// actually have items (in canonical order) so a click never lands on an
// empty page.
defineProps<{
  modelValue: T | null
  options: readonly T[]
  label: (id: T) => string
  allLabel: string
  groupLabel: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: T | null] }>()
</script>
