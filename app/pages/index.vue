<template>
  <div>
    <HeroSection image="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2400&q=80" />

    <!-- Category tiles -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
      <SectionHeading :kicker="t('home.categoriesKicker')" :title="t('home.categoriesTitle')" />
      <div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <NuxtLink
          v-for="c in categories"
          :key="c.id"
          :to="localePath({ path: '/vehicles', query: { category: c.id } })"
          class="group relative overflow-hidden aspect-[4/5] border-t-2 border-transparent hover:border-gold-500 transition-colors"
        >
          <NuxtImg
            :src="c.image"
            :alt="t(`categories.${c.id}`)"
            class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="sm:100vw md:50vw lg:25vw"
            loading="lazy"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/30 to-transparent" aria-hidden="true" />
          <div class="absolute bottom-0 inset-x-0 p-5">
            <h3 class="text-lg font-semibold uppercase tracking-wide text-bone-100 group-hover:text-gold-400 transition-colors">
              {{ t(`categories.${c.id}`) }}
            </h3>
            <p class="mt-1 text-xs text-bone-400 uppercase tracking-widest">
              {{ byCategory(c.id).length }} ·
              <span class="text-gold-500">{{ t('common.viewFleet') }}</span>
            </p>
          </div>
        </NuxtLink>
      </div>
    </section>

    <!-- Featured vehicles -->
    <section class="bg-ink-900 border-y border-ink-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div class="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading :kicker="t('home.featuredKicker')" :title="t('home.featuredTitle')" />
          <NuxtLink :to="localePath('/vehicles')" class="btn-ghost !px-5 !py-2.5">
            {{ t('home.featuredAll') }}
          </NuxtLink>
        </div>
        <div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <VehicleCard v-for="v in featured()" :key="v.id" :vehicle="v" />
        </div>
      </div>
    </section>

    <!-- Why us -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
      <SectionHeading :kicker="t('home.whyKicker')" :title="t('home.whyTitle')" center />
      <div class="mt-12 grid gap-10 md:grid-cols-3">
        <div v-for="(item, i) in whyItems" :key="i" class="text-center">
          <div class="mx-auto w-14 h-14 flex items-center justify-center border border-gold-500/40 text-gold-500">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" v-html="item.icon" />
          </div>
          <h3 class="mt-5 text-lg font-semibold uppercase tracking-wide text-bone-100">
            {{ t(item.title) }}
          </h3>
          <p class="mt-2.5 text-sm text-bone-400 leading-relaxed max-w-xs mx-auto">
            {{ t(item.text) }}
          </p>
        </div>
      </div>
    </section>

    <CtaBanner />
  </div>
</template>

<script setup lang="ts">
import { categories } from '~/data/categories'

const { t } = useI18n()
const localePath = useLocalePath()
const { byCategory, featured } = await useVehicles()

const whyItems = [
  {
    title: 'home.why1Title',
    text: 'home.why1Text',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />',
  },
  {
    title: 'home.why2Title',
    text: 'home.why2Text',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />',
  },
  {
    title: 'home.why3Title',
    text: 'home.why3Text',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />',
  },
]

useSeoMeta({
  title: t('meta.home.title'),
  description: t('meta.home.description'),
  ogTitle: `${t('meta.home.title')} · Creative Filmmaking`,
  ogDescription: t('meta.home.description'),
  ogImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80',
})
</script>
