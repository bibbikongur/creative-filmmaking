<template>
  <div class="inline-flex border border-ink-700" role="group" :aria-label="t('catalogue.viewLabel')">
    <button
      type="button"
      class="inline-flex items-center gap-2 px-3 min-h-[2.25rem] text-xs font-heading font-semibold uppercase tracking-wider transition-colors"
      :class="modelValue === 'grid' ? 'bg-ink-800 text-bone-100' : 'text-bone-400 hover:text-bone-100'"
      :aria-pressed="modelValue === 'grid'"
      @click="emit('update:modelValue', 'grid')"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5h6v6H4zM14 5h6v6h-6zM4 13h6v6H4zM14 13h6v6h-6z" />
      </svg>
      {{ t('catalogue.viewGrid') }}
    </button>
    <button
      type="button"
      class="inline-flex items-center gap-2 px-3 min-h-[2.25rem] text-xs font-heading font-semibold uppercase tracking-wider border-l border-ink-700 transition-colors"
      :class="modelValue === 'list' ? 'bg-ink-800 text-bone-100' : 'text-bone-400 hover:text-bone-100'"
      :aria-pressed="modelValue === 'list'"
      @click="emit('update:modelValue', 'list')"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
      {{ t('catalogue.viewList') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { CatalogueView } from '~/composables/useCatalogueView'

defineProps<{ modelValue: CatalogueView }>()
const emit = defineEmits<{ 'update:modelValue': [value: CatalogueView] }>()
const { t } = useI18n()
</script>
