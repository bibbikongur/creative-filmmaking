<template>
  <!-- Photographic entry points to the fleet by type. The first tile is the hero of the
       group (2×2 on desktop), the rest fill the remaining quadrant. -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
    <NuxtLink
      v-for="(tile, i) in tiles"
      :key="tile.to"
      :to="tile.to"
      class="group relative block overflow-hidden bg-ink-800 border-t-2 border-transparent hover:border-gold-500 transition-colors"
      :class="i === 0 ? 'col-span-2 row-span-2 aspect-[4/3] lg:aspect-auto' : 'aspect-[4/3]'"
    >
      <NuxtImg
        v-if="tile.image"
        :src="tile.image"
        :provider="imgProvider(tile.image)"
        alt=""
        class="absolute inset-0 w-full h-full object-cover brightness-[.7] saturate-[.85] transition-transform duration-700 motion-safe:group-hover:scale-105"
        :sizes="i === 0 ? 'xs:100vw lg:50vw' : 'xs:50vw lg:25vw'"
        format="webp"
        loading="lazy"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/30 to-transparent" aria-hidden="true" />
      <div class="absolute inset-x-0 bottom-0 p-4 sm:p-5 flex items-end justify-between gap-3">
        <div class="min-w-0">
          <h3 class="font-heading font-semibold uppercase tracking-wide text-bone-100 leading-tight" :class="i === 0 ? 'text-2xl sm:text-3xl' : 'text-base sm:text-lg'">
            {{ tile.title }}
          </h3>
          <p class="mt-1 meta">{{ tile.count }}</p>
        </div>
        <svg class="w-5 h-5 shrink-0 text-gold-500 transition-transform motion-safe:group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </div>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
export interface CategoryTile {
  title: string
  /** Already-localised count label, e.g. "4 bílar" */
  count: string
  to: string
  image?: string
}

defineProps<{ tiles: CategoryTile[] }>()
</script>
