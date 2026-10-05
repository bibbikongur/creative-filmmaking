<template>
  <section class="relative min-h-[80svh] flex items-end overflow-hidden film-grain bg-ink-950 bg-hero-vignette">
    <!-- Backdrop. Slightly darkened so the bone text stays legible; anchored right of
         centre so the trucks and headlights survive the portrait crop on phones. The gold
         vignette underneath covers the no-photo case. -->
    <NuxtImg
      v-if="image"
      :src="image"
      :provider="imgProvider(image)"
      alt=""
      class="absolute inset-0 w-full h-full object-cover object-[62%_55%] brightness-95"
      sizes="xs:100vw sm:100vw md:100vw lg:100vw xl:100vw xxl:100vw"
      preload
      fetchpriority="high"
    />
    <!-- Legibility scrims: bottom-up black + left-side shade behind the copy -->
    <div class="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/45 to-ink-950/10" aria-hidden="true" />
    <div class="absolute inset-0 bg-gradient-to-r from-ink-950/60 via-ink-950/10 to-transparent" aria-hidden="true" />

    <div class="relative wrap pb-16 lg:pb-24 pt-36 w-full">
      <p class="kicker flex items-center gap-2.5">
        <span class="w-2 h-2 rounded-full bg-signal-500 motion-safe:animate-pulse" aria-hidden="true" />
        {{ t('hero.availability') }}
      </p>
      <h1 class="display mt-5 max-w-3xl">
        {{ t('hero.title') }}
      </h1>
      <p class="mt-6 max-w-xl text-lg text-bone-400 leading-relaxed">
        {{ t('hero.subtitle') }}
      </p>
      <div class="mt-9 flex flex-col sm:flex-row gap-3">
        <NuxtLink :to="localePath('/vehicles')" class="btn-gold">
          {{ t('common.viewFleet') }}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </NuxtLink>
        <NuxtLink :to="localePath('/contact')" class="btn-outline">
          {{ t('nav.cta') }}
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{ image?: string }>()

const { t } = useI18n()
const localePath = useLocalePath()
</script>
