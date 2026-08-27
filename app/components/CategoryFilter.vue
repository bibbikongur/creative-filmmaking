<template>
  <div class="flex flex-wrap gap-2" role="group" :aria-label="t('catalogue.kicker')">
    <button
      type="button"
      class="px-4 py-2 text-xs uppercase tracking-widest font-semibold border transition-colors"
      :class="!modelValue
        ? 'bg-gold-500 text-ink-950 border-gold-500'
        : 'border-ink-700 text-bone-400 hover:border-gold-500 hover:text-bone-100'"
      @click="$emit('update:modelValue', null)"
    >
      {{ t('catalogue.all') }}
    </button>
    <button
      v-for="c in shown"
      :key="c.id"
      type="button"
      class="px-4 py-2 text-xs uppercase tracking-widest font-semibold border transition-colors"
      :class="modelValue === c.id
        ? 'bg-gold-500 text-ink-950 border-gold-500'
        : 'border-ink-700 text-bone-400 hover:border-gold-500 hover:text-bone-100'"
      @click="$emit('update:modelValue', c.id)"
    >
      {{ t(`categories.${c.id}`) }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { categories } from '~/data/categories'
import type { VehicleCategory } from '~/types'

const props = defineProps<{
  modelValue: VehicleCategory | null
  /** Categories that actually have vehicles — empty ones are hidden so a
   *  filter click never lands on a bare "nothing here" page. */
  available?: VehicleCategory[]
}>()
defineEmits<{ 'update:modelValue': [value: VehicleCategory | null] }>()

const shown = computed(() =>
  props.available ? categories.filter(c => props.available!.includes(c.id)) : categories,
)

const { t } = useI18n()
</script>
