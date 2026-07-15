<template>
  <div class="group flex flex-col bg-ink-800 border-t-2 border-transparent hover:border-gold-500 transition-colors duration-300">
    <!-- Image -->
    <div class="relative overflow-hidden aspect-card" :class="item.images.length ? 'bg-white' : 'bg-ink-900'">
      <NuxtImg
        v-if="item.images.length"
        :key="active"
        :src="item.images[active]"
        :provider="imgProvider(item.images[active])"
        :alt="`${lt(item.name)}${item.images.length > 1 ? ` (${active + 1}/${item.images.length})` : ''}`"
        class="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
        sizes="sm:100vw md:50vw lg:33vw"
        loading="lazy"
      />
      <div v-else class="w-full h-full flex items-center justify-center" aria-hidden="true">
        <svg class="w-8 h-8 text-bone-400/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <span class="absolute top-3 left-3 px-2.5 py-1 bg-ink-950/70 backdrop-blur text-gold-400 text-[11px] uppercase tracking-widest font-semibold">
        {{ t(`equipmentCategories.${item.category}`) }}
      </span>

      <!-- Prev / next + dots when there is more than one photo -->
      <template v-if="item.images.length > 1">
        <button
          type="button"
          class="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-ink-950/60 backdrop-blur text-bone-100 hover:text-gold-400 transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          aria-label="Previous image"
          @click="step(-1)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          type="button"
          class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-ink-950/60 backdrop-blur text-bone-100 hover:text-gold-400 transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          aria-label="Next image"
          @click="step(1)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div class="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5">
          <button
            v-for="(_, i) in item.images"
            :key="i"
            type="button"
            class="w-1.5 h-1.5 rounded-full transition-colors"
            :class="i === active ? 'bg-gold-400' : 'bg-bone-100/50 hover:bg-bone-100'"
            :aria-label="`Image ${i + 1}`"
            @click="active = i"
          />
        </div>
      </template>
    </div>

    <!-- Body -->
    <div class="flex-1 flex flex-col p-5">
      <h3 class="text-xl font-semibold uppercase tracking-wide text-bone-100">
        {{ lt(item.name) }}
      </h3>
      <p v-if="lt(item.tagline)" class="mt-2 text-sm text-bone-400 leading-relaxed">
        {{ lt(item.tagline) }}
      </p>

      <div class="mt-4 pt-4 border-t border-ink-700">
        <AddToCartButton type="equipment" :id="item.id" compact />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EquipmentItem } from '~/types'

const props = defineProps<{ item: EquipmentItem }>()

const { t } = useI18n()
const { lt } = useLocalized()

const active = ref(0)

const step = (dir: number) => {
  active.value = (active.value + dir + props.item.images.length) % props.item.images.length
}
</script>
