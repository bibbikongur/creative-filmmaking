<template>
  <div class="group flex flex-col bg-ink-800 border-t-2 border-transparent hover:border-gold-500 transition-colors duration-300">
    <!-- Image -->
    <div class="relative overflow-hidden aspect-card">
      <NuxtImg
        :src="item.images[0]"
        :provider="imgProvider(item.images[0])"
        :alt="lt(item.name)"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        sizes="sm:100vw md:50vw lg:33vw"
        loading="lazy"
      />
      <span class="absolute top-3 left-3 px-2.5 py-1 bg-ink-950/70 backdrop-blur text-gold-400 text-[11px] uppercase tracking-widest font-semibold">
        {{ t(`equipmentCategories.${item.category}`) }}
      </span>
    </div>

    <!-- Body -->
    <div class="flex-1 flex flex-col p-5">
      <h3 class="text-xl font-semibold uppercase tracking-wide text-bone-100">
        {{ lt(item.name) }}
      </h3>
      <p v-if="lt(item.tagline)" class="mt-2 text-sm text-bone-400 leading-relaxed">
        {{ lt(item.tagline) }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EquipmentItem } from '~/types'

defineProps<{ item: EquipmentItem }>()

const { t } = useI18n()
const { lt } = useLocalized()
</script>
