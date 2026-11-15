<template>
  <!-- The title link is stretched over the whole card (after:inset-0), so the card stays
       clickable without wrapping buttons inside an <a>. Interactive children sit above it
       with relative z-10. `layout="row"` lays the image beside the text (catalogue list view). -->
  <article
    class="group relative flex bg-ink-800 border-t-2 border-transparent hover:border-gold-500 focus-within:border-gold-500 transition-colors duration-300"
    :class="row ? 'flex-col md:flex-row md:items-stretch' : 'flex-col'"
    @touchstart.passive="swipeStart"
    @touchend.passive="swipeEnd"
  >
    <!-- Image -->
    <div
      class="relative overflow-hidden bg-ink-900 aspect-card"
      :class="row ? 'md:w-[22rem] lg:w-[26rem] md:shrink-0' : ''"
    >
      <NuxtImg
        v-if="vehicle.images.length"
        :key="active"
        :src="vehicle.images[active]!"
        :provider="imgProvider(vehicle.images[active]!)"
        :alt="lt(vehicle.name)"
        class="w-full h-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
        :class="row ? 'md:absolute md:inset-0' : ''"
        :sizes="row ? 'xs:100vw md:416px' : sizes"
        format="webp"
        loading="lazy"
      />
      <ImagePlaceholder v-else />
      <span class="absolute top-3 left-3 px-2.5 py-1 bg-ink-950/70 backdrop-blur text-gold-400 text-[11px] uppercase tracking-widest font-semibold">
        {{ t(`categories.${vehicle.category}`) }}
      </span>

      <!-- Prev / next + dots when there is more than one photo (same as the equipment
           cards). Arrows are always visible on touch screens and appear on hover/focus
           elsewhere; a sideways swipe on the card does the same. -->
      <template v-if="vehicle.images.length > 1">
        <button
          type="button"
          class="absolute z-10 left-2 top-1/2 -translate-y-1/2 p-2.5 bg-ink-950/60 backdrop-blur text-bone-100 hover:text-gold-400 hover:bg-ink-950/80 transition md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100"
          :aria-label="t('common.prevImage')"
          @click.stop="step(-1)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          type="button"
          class="absolute z-10 right-2 top-1/2 -translate-y-1/2 p-2.5 bg-ink-950/60 backdrop-blur text-bone-100 hover:text-gold-400 hover:bg-ink-950/80 transition md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100"
          :aria-label="t('common.nextImage')"
          @click.stop="step(1)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div class="absolute z-10 bottom-1 inset-x-0 flex flex-wrap justify-center px-10">
          <button
            v-for="(_, i) in vehicle.images"
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
    <div class="flex-1 flex flex-col p-5" :class="row ? 'md:p-6 md:justify-center' : ''">
      <h3 class="h3">
        <NuxtLink
          :to="localePath(`/vehicles/${vehicle.slug}`)"
          class="after:absolute after:inset-0 after:content-[''] group-hover:text-gold-400 transition-colors focus-visible:outline-none"
        >
          {{ lt(vehicle.name) }}
        </NuxtLink>
      </h3>
      <p class="mt-2 text-sm text-bone-400 leading-relaxed" :class="row ? 'md:text-base' : 'line-clamp-2 min-h-[2.5rem]'">
        {{ lt(vehicle.tagline) }}
      </p>

      <!-- Micro specs -->
      <div class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-bone-400">
        <span v-if="vehicle.specs.units && vehicle.specs.units > 1" class="flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v10a1 1 0 001 1h10a1 1 0 001-1V7a1 1 0 00-1-1H9a1 1 0 00-1 1z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 17v2a1 1 0 01-1 1H5a1 1 0 01-1-1V9a1 1 0 011-1h2" />
          </svg>
          {{ vehicle.specs.units }} {{ t('vehicle.specs.unitsShort') }}
        </span>
        <span v-if="vehicle.specs.seats" class="flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0 .656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {{ vehicle.specs.seats }} {{ t('vehicle.specs.seats').toLowerCase() }}
        </span>
        <span v-if="vehicle.specs.sleeps" class="flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12h18M3 12v6m18-6v6M5 12V7a2 2 0 012-2h10a2 2 0 012 2v5" />
          </svg>
          {{ vehicle.specs.sleeps }} {{ t('vehicle.specs.sleeps').toLowerCase() }}
        </span>
        <span v-if="vehicle.specs.drivetrain && vehicle.specs.drivetrain !== '2wd'" class="flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke-width="2" />
            <circle cx="12" cy="12" r="3" stroke-width="2" />
          </svg>
          {{ vehicle.specs.drivetrain.toUpperCase() }}
        </span>
        <span v-if="vehicle.specs.generator" class="flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {{ t('vehicle.specs.generator') }}
        </span>
        <!-- Row layout has room for two more facts -->
        <template v-if="row">
          <span v-if="vehicle.specs.towingCapacityKg" class="flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 17h16M7 17a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4zM3 13h18l-2-5H5l-2 5z" />
            </svg>
            {{ vehicle.specs.towingCapacityKg.toLocaleString(locale === 'is' ? 'is-IS' : 'en-GB') }} kg {{ t('vehicle.specs.towingCapacityKg').toLowerCase() }}
          </span>
          <span v-if="vehicle.specs.heating" class="flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3c1 3 4 5 4 9a4 4 0 11-8 0c0-2 1-3 1-3s0 2 2 2c0-3-1-5 1-8z" />
            </svg>
            {{ t('vehicle.specs.heating') }}
          </span>
        </template>
      </div>

      <!-- Footer: pushed to the bottom so cards in a row line up -->
      <div class="mt-auto pt-4 border-t border-ink-700 flex items-center justify-between gap-3" :class="row ? 'md:mt-6' : ''">
        <span class="text-sm font-heading font-semibold uppercase tracking-wider text-gold-500 group-hover:text-gold-400 transition-colors flex items-center gap-2">
          {{ t('common.viewDetails') }}
          <svg class="w-4 h-4 transition-transform motion-safe:group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </span>
        <AddToCartButton type="vehicle" :id="vehicle.id" compact class="relative z-10" />
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { Vehicle } from '~/types'

const props = withDefaults(defineProps<{
  vehicle: Vehicle
  /** @nuxt/image sizes string matching the grid the card sits in */
  sizes?: string
  /** "row" puts the photo beside the text (catalogue list view) */
  layout?: 'grid' | 'row'
}>(), {
  sizes: 'xs:100vw sm:50vw md:33vw',
  layout: 'grid',
})

const row = computed(() => props.layout === 'row')

const { t, locale } = useI18n()
const { lt } = useLocalized()
const localePath = useLocalePath()

// Photo browsing on the card
const active = ref(0)
const step = (dir: number) => {
  active.value = (active.value + dir + props.vehicle.images.length) % props.vehicle.images.length
}

let swipeX = 0
let swipeY = 0
const swipeStart = (e: TouchEvent) => {
  swipeX = e.touches[0]?.clientX ?? 0
  swipeY = e.touches[0]?.clientY ?? 0
}
const swipeEnd = (e: TouchEvent) => {
  if (props.vehicle.images.length < 2) return
  const dx = (e.changedTouches[0]?.clientX ?? 0) - swipeX
  const dy = (e.changedTouches[0]?.clientY ?? 0) - swipeY
  if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1)
}
</script>
