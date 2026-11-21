<template>
  <section class="relative min-h-[34rem] lg:min-h-[min(78svh,47rem)] flex items-end overflow-hidden film-grain bg-ink-950 bg-hero-vignette">
    <!-- Backdrop. Slightly darkened so the bone text stays legible; anchored right of
         centre so the trucks and headlights survive the portrait crop on phones. The gold
         vignette underneath covers the no-photo case. -->
    <NuxtImg
      v-if="image"
      :src="image"
      :provider="imgProvider(image)"
      :alt="t('home.heroAlt')"
      class="absolute inset-0 w-full h-full object-cover object-[62%_55%] brightness-95"
      sizes="xs:100vw sm:100vw md:100vw lg:100vw xl:100vw"
      format="webp"
      fetchpriority="high"
    />
    <!-- Legibility scrims: bottom-up black + left-side shade behind the copy -->
    <div class="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/55 to-ink-950/10" aria-hidden="true" />
    <div class="absolute inset-0 bg-gradient-to-r from-ink-950/70 via-ink-950/15 to-transparent" aria-hidden="true" />

    <div class="relative wrap pb-8 lg:pb-10 pt-24 lg:pt-28 w-full">
      <p class="kicker">{{ t('home.heroKicker') }}</p>
      <h1 class="display mt-4 max-w-3xl [text-wrap:balance]">
        {{ t('hero.title') }}
      </h1>
      <p class="mt-5 max-w-2xl text-base sm:text-lg text-bone-100/85 leading-relaxed [text-wrap:balance]">
        {{ t('home.heroSubtitle') }}
      </p>
      <!-- The two catalogues are the two ways in -->
      <div class="mt-7 flex flex-col sm:flex-row gap-3">
        <NuxtLink :to="localePath('/vehicles')" class="btn-gold">
          {{ t('common.viewFleet') }}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </NuxtLink>
        <NuxtLink :to="localePath('/equipment')" class="btn bg-ink-950/50 border border-bone-100/60 text-bone-100 hover:border-bone-100 hover:bg-ink-950/70">
          {{ t('common.viewEquipment') }}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </NuxtLink>
      </div>

      <!-- How renting works, on the photo's dark foot: the visitor reads the model
           (no price list, one list, one quote) before meeting an "add to list" button. -->
      <section class="mt-9 lg:mt-11 border-t border-bone-100/20 pt-5" :aria-label="t('home.howKicker')">
        <p class="text-sm sm:text-base font-medium text-bone-100">{{ t('home.heroModel') }}</p>
        <ol class="mt-4 grid gap-y-3 sm:grid-cols-3 sm:gap-x-8">
          <li v-for="(step, i) in steps" :key="i" class="flex items-baseline gap-3 sm:border-l sm:border-bone-100/15 sm:pl-5 sm:first:border-l-0 sm:first:pl-0">
            <span class="font-heading text-base font-medium text-bone-400 tabular-nums" aria-hidden="true">0{{ i + 1 }}</span>
            <p class="text-sm leading-snug text-bone-400">
              <span class="block font-heading font-medium uppercase tracking-wider text-bone-100">{{ step.title }}</span>
              <span class="hidden sm:block mt-0.5 [text-wrap:balance]">{{ step.text }}</span>
            </p>
          </li>
        </ol>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  image?: string
  steps: { title: string, text: string }[]
}>()

const { t } = useI18n()
const localePath = useLocalePath()
</script>
