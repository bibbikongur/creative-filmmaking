<template>
  <!-- Same shell as VehicleCard: stretched title link, interactive children at z-10. -->
  <article class="group relative flex flex-col bg-ink-800 border-t-2 border-transparent hover:border-gold-500 focus-within:border-gold-500 transition-colors duration-300">
    <!-- Image. Equipment photos are opaque white manufacturer cutouts, so they live in a
         deliberate white "product well" (shared with the detail gallery) rather than fighting
         the dark stage. -->
    <div class="relative overflow-hidden aspect-card" :class="item.images.length ? 'bg-product-well' : 'bg-ink-900'">
      <NuxtImg
        v-if="item.images.length"
        :key="active"
        :src="item.images[active]!"
        :provider="imgProvider(item.images[active]!)"
        :alt="lt(item.name)"
        class="w-full h-full object-contain p-4 transition-transform duration-500 motion-safe:group-hover:scale-105"
        :sizes="sizes"
        format="webp"
        loading="lazy"
      />
      <ImagePlaceholder v-else />
      <span class="absolute top-3 left-3 px-2.5 py-1 bg-ink-950/70 backdrop-blur text-gold-400 text-[11px] uppercase tracking-widest font-semibold">
        {{ t(`equipmentCategories.${item.category}`) }}
      </span>

      <!-- Prev / next + dots when there is more than one photo. Arrows are always visible
           on touch screens (no hover there) and appear on hover/focus elsewhere. -->
      <template v-if="item.images.length > 1">
        <button
          type="button"
          class="absolute z-10 left-2 top-1/2 -translate-y-1/2 p-2.5 bg-ink-950/60 backdrop-blur text-bone-100 hover:text-gold-400 transition-opacity md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100"
          :aria-label="t('common.prevImage')"
          @click.stop="step(-1)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          type="button"
          class="absolute z-10 right-2 top-1/2 -translate-y-1/2 p-2.5 bg-ink-950/60 backdrop-blur text-bone-100 hover:text-gold-400 transition-opacity md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100"
          :aria-label="t('common.nextImage')"
          @click.stop="step(1)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div class="absolute z-10 bottom-1 left-1/2 -translate-x-1/2 flex">
          <button
            v-for="(_, i) in item.images"
            :key="i"
            type="button"
            class="p-1.5"
            :aria-label="t('common.imageN', { n: i + 1 })"
            :aria-current="i === active ? 'true' : undefined"
            @click.stop="active = i"
          >
            <span
              class="block w-2 h-2 rounded-full ring-1 ring-ink-950/40 transition-colors"
              :class="i === active ? 'bg-gold-400' : 'bg-bone-100/70 hover:bg-bone-100'"
            />
          </button>
        </div>
      </template>
    </div>

    <!-- Body -->
    <div class="flex-1 flex flex-col p-5">
      <h3 class="h3">
        <NuxtLink
          :to="localePath(`/equipment/${equipmentSlug(item)}`)"
          class="after:absolute after:inset-0 after:content-[''] group-hover:text-gold-400 transition-colors focus-visible:outline-none"
        >
          {{ lt(item.name) }}
        </NuxtLink>
      </h3>
      <p class="mt-2 text-sm text-bone-400 leading-relaxed line-clamp-2 min-h-[2.5rem]">
        {{ lt(item.tagline) }}
      </p>

      <div class="mt-auto pt-4 border-t border-ink-700 flex items-center justify-between gap-3">
        <span class="text-sm font-heading font-semibold uppercase tracking-wider text-gold-500 group-hover:text-gold-400 transition-colors flex items-center gap-2">
          {{ t('common.viewDetails') }}
          <svg class="w-4 h-4 transition-transform motion-safe:group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </span>
        <AddToCartButton type="equipment" :id="item.id" compact class="relative z-10" />
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { EquipmentItem } from '~/types'

const props = withDefaults(defineProps<{
  item: EquipmentItem
  /** @nuxt/image sizes string matching the grid the card sits in */
  sizes?: string
}>(), {
  sizes: 'xs:100vw sm:50vw md:33vw',
})

const { t } = useI18n()
const { lt } = useLocalized()
const localePath = useLocalePath()

const active = ref(0)

const step = (dir: number) => {
  active.value = (active.value + dir + props.item.images.length) % props.item.images.length
}
</script>
