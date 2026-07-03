<template>
  <NuxtLink
    :to="localePath(`/vehicles/${vehicle.slug}`)"
    class="group flex flex-col bg-ink-800 border-t-2 border-transparent hover:border-gold-500 transition-colors duration-300"
  >
    <!-- Image -->
    <div class="relative overflow-hidden aspect-card">
      <NuxtImg
        :src="vehicle.images[0]"
        :alt="lt(vehicle.name)"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        sizes="sm:100vw md:50vw lg:33vw"
        loading="lazy"
      />
      <span class="absolute top-3 left-3 px-2.5 py-1 bg-ink-950/70 backdrop-blur text-gold-400 text-[11px] uppercase tracking-widest font-semibold">
        {{ t(`categories.${vehicle.category}`) }}
      </span>
    </div>

    <!-- Body -->
    <div class="flex-1 flex flex-col p-5">
      <h3 class="text-xl font-semibold uppercase tracking-wide text-bone-100 group-hover:text-gold-400 transition-colors">
        {{ lt(vehicle.name) }}
      </h3>
      <p class="mt-2 text-sm text-bone-400 leading-relaxed line-clamp-2">
        {{ lt(vehicle.tagline) }}
      </p>

      <!-- Micro specs -->
      <div class="mt-4 flex items-center gap-4 text-xs text-bone-400">
        <span v-if="vehicle.specs.seats" class="flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0 .656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {{ vehicle.specs.seats }} {{ t('vehicle.specs.seats').toLowerCase() }}
        </span>
        <span v-if="vehicle.specs.sleeps" class="flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12h18M3 12v6m18-6v6M5 12V7a2 2 0 012-2h10a2 2 0 012 2v5" />
          </svg>
          {{ vehicle.specs.sleeps }} {{ t('vehicle.specs.sleeps').toLowerCase() }}
        </span>
        <span v-if="vehicle.specs.drivetrain && vehicle.specs.drivetrain !== '2wd'" class="flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" stroke-width="2" />
            <circle cx="12" cy="12" r="3" stroke-width="2" />
          </svg>
          {{ vehicle.specs.drivetrain.toUpperCase() }}
        </span>
        <span v-if="vehicle.specs.generator" class="flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {{ t('vehicle.specs.generator') }}
        </span>
      </div>

      <!-- CTA -->
      <p class="mt-5 pt-4 border-t border-ink-700 text-sm font-heading font-semibold uppercase tracking-wider text-gold-500 group-hover:text-gold-400 transition-colors flex items-center gap-2">
        {{ t('common.requestOffer') }}
        <svg class="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </p>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Vehicle } from '~/types'

defineProps<{ vehicle: Vehicle }>()

const { t } = useI18n()
const { lt } = useLocalized()
const localePath = useLocalePath()
</script>
