<template>
  <section class="relative min-h-[90vh] flex items-end overflow-hidden film-grain">
    <!-- Backdrop -->
    <NuxtImg
      :src="image"
      alt=""
      class="absolute inset-0 w-full h-full object-cover"
      sizes="100vw"
      preload
      fetchpriority="high"
    />
    <!-- Legibility scrims: bottom-up black + slight vignette -->
    <div class="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-ink-950/20" aria-hidden="true" />
    <div class="absolute inset-0 bg-gradient-to-r from-ink-950/60 via-transparent to-transparent" aria-hidden="true" />

    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 lg:pb-28 pt-40 w-full">
      <p class="flex items-center gap-2.5 text-xs uppercase tracking-[0.25em] text-bone-400 font-medium">
        <span class="w-2 h-2 rounded-full bg-signal-500 animate-pulse" aria-hidden="true" />
        {{ t('hero.availability') }}
      </p>
      <h1 class="mt-5 max-w-4xl text-4xl/[1.15] sm:text-5xl/[1.15] lg:text-6xl/[1.15] font-semibold uppercase tracking-wide text-bone-100">
        {{ t('hero.title') }}
      </h1>
      <p class="mt-6 max-w-2xl text-lg text-bone-400 leading-relaxed">
        {{ t('hero.subtitle') }}
      </p>
      <div class="mt-9 flex flex-col sm:flex-row gap-4">
        <NuxtLink :to="localePath('/vehicles')" class="btn-gold">
          {{ t('common.viewFleet') }}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </NuxtLink>
        <NuxtLink :to="localePath('/equipment')" class="btn-gold">
          {{ t('common.viewEquipment') }}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </NuxtLink>
        <NuxtLink :to="localePath('/contact')" class="btn-ghost">
          {{ t('common.requestOffer') }}
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{ image: string }>()

const { t } = useI18n()
const localePath = useLocalePath()
</script>
