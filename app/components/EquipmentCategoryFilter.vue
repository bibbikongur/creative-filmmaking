<template>
  <div class="flex flex-wrap gap-2" role="group" :aria-label="t('equipmentCatalogue.kicker')">
    <button
      type="button"
      class="px-4 py-2 text-xs uppercase tracking-widest font-semibold border transition-colors"
      :class="!modelValue
        ? 'bg-gold-500 text-ink-950 border-gold-500'
        : 'border-ink-700 text-bone-400 hover:border-gold-500 hover:text-bone-100'"
      @click="$emit('update:modelValue', null)"
    >
      {{ t('equipmentCatalogue.all') }}
    </button>
    <button
      v-for="c in equipmentCategories"
      :key="c"
      type="button"
      class="px-4 py-2 text-xs uppercase tracking-widest font-semibold border transition-colors"
      :class="modelValue === c
        ? 'bg-gold-500 text-ink-950 border-gold-500'
        : 'border-ink-700 text-bone-400 hover:border-gold-500 hover:text-bone-100'"
      @click="$emit('update:modelValue', c)"
    >
      {{ t(`equipmentCategories.${c}`) }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { equipmentCategories } from '~/data/equipmentCategories'
import type { EquipmentCategory } from '~/types'

defineProps<{ modelValue: EquipmentCategory | null }>()
defineEmits<{ 'update:modelValue': [value: EquipmentCategory | null] }>()

const { t } = useI18n()
</script>
