<template>
  <div>
    <HeroSection :image="heroImage" />

    <!-- Proof strip: four facts, one row, straight under the hero -->
    <section class="bg-ink-900 border-b border-ink-800" :aria-label="t('home.statsLabel')">
      <dl class="wrap grid grid-cols-2 lg:grid-cols-4">
        <div
          v-for="(s, i) in stats"
          :key="i"
          class="py-6 lg:py-7 border-ink-800"
          :class="[i % 2 === 1 ? 'border-l pl-6 lg:pl-8' : '', i >= 2 ? 'border-t lg:border-t-0 lg:border-l lg:pl-8' : '']"
        >
          <dd class="font-heading font-semibold text-3xl sm:text-4xl text-gold-500 tabular-nums leading-none">{{ s.value }}</dd>
          <dt class="mt-2 meta">{{ s.label }}</dt>
        </div>
      </dl>
    </section>

    <!-- Featured vehicles -->
    <section class="wrap section">
      <div class="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading :kicker="t('home.featuredKicker')" :title="t('home.featuredTitle')" />
        <NuxtLink :to="localePath('/vehicles')" class="btn-outline btn-sm">
          {{ t('home.featuredAll') }}
        </NuxtLink>
      </div>
      <div class="mt-10 card-grid xl:grid-cols-4">
        <VehicleCard v-for="v in featured()" :key="v.id" :vehicle="v" sizes="xs:100vw sm:50vw md:33vw xl:25vw" />
      </div>
    </section>

    <!-- Featured equipment -->
    <section v-if="featuredEquipment.length" class="bg-ink-900 border-y border-ink-800">
      <div class="wrap section">
      <div class="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading :kicker="t('home.featuredEquipmentKicker')" :title="t('home.featuredEquipmentTitle')" :intro="t('home.featuredEquipmentIntro')" />
        <NuxtLink :to="localePath('/equipment')" class="btn-outline btn-sm">
          {{ t('home.featuredEquipmentAll') }}
        </NuxtLink>
      </div>
        <div class="mt-10 card-grid xl:grid-cols-4">
          <EquipmentCard v-for="e in featuredEquipment" :key="e.id" :item="e" sizes="xs:100vw sm:50vw md:33vw xl:25vw" />
        </div>
      </div>
    </section>

    <!-- How it works: a real three-step sequence, so the numbers carry meaning -->
    <section>
      <div class="wrap section">
        <div class="grid gap-10 lg:grid-cols-5 lg:items-start">
          <div class="lg:col-span-2">
            <SectionHeading :kicker="t('home.howKicker')" :title="t('home.howTitle')" :intro="t('home.howIntro')" />
            <NuxtLink :to="localePath('/contact')" class="btn-gold mt-8">
              {{ t('nav.cta') }}
            </NuxtLink>
          </div>
          <ol class="lg:col-span-3 grid gap-px bg-ink-700 border border-ink-700 sm:grid-cols-3">
            <li v-for="(step, i) in steps" :key="i" class="bg-ink-950 p-6 sm:p-7 flex flex-col">
              <span class="font-heading font-semibold text-4xl text-gold-500 tabular-nums leading-none" aria-hidden="true">0{{ i + 1 }}</span>
              <h3 class="h4 mt-6">{{ t(step.title) }}</h3>
              <p class="mt-3 text-sm text-bone-400 leading-relaxed">{{ t(step.text) }}</p>
            </li>
          </ol>
        </div>
      </div>
    </section>

    <!-- Why us -->
    <section class="bg-ink-900 border-y border-ink-800">
      <div class="wrap section">
        <SectionHeading :kicker="t('home.whyKicker')" :title="t('home.whyTitle')" />
        <div class="mt-10 grid gap-8 md:grid-cols-3">
          <div v-for="(item, i) in whyItems" :key="i" class="border-l-2 border-gold-500 pl-5">
            <svg class="w-6 h-6 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" v-html="item.icon" />
            <h3 class="h3 mt-4">
              {{ t(item.title) }}
            </h3>
            <p class="mt-2.5 text-sm text-bone-400 leading-relaxed">
              {{ t(item.text) }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ: the pre-sales questions every enquiry starts with, answered in
         crawlable HTML (and as schema.org Question nodes). -->
    <section v-if="faqItems.length" class="wrap section">
      <FaqSection :kicker="t('faq.kicker')" :title="t('faq.title')" :items="faqItems" open-first />
    </section>

    <CtaBanner />
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { featured, all } = await useVehicles()
const { faq } = useFaq()
const faqItems = faq('faq.home')
const { all: allEquipment, featured: featuredEquipmentItems } = await useEquipment()

// Cinematic still of a shoot on an Icelandic road (public/images/hero.jpg). If it is
// ever removed, the first featured vehicle photo stands in (HeroSection darkens it).
const HERO_IMAGE: string | undefined = '/images/hero.jpg'
const heroImage = computed(() => HERO_IMAGE ?? featured()[0]?.images[0] ?? all().find(v => v.images[0])?.images[0])

// Counted from the live catalogue so the number never goes stale.
const fleetCount = computed(() => all().reduce((n, v) => n + (v.specs.units ?? 1), 0))
const stats = computed(() => [
  { value: `${fleetCount.value}+`, label: t('home.stats.fleet') },
  { value: t('home.stats.deliveryValue'), label: t('home.stats.delivery') },
  { value: t('home.stats.responseValue'), label: t('home.stats.response') },
  { value: '24/7', label: t('home.stats.support') },
])

// Items ticked "featured" in the admin fill the home section; until any are
// ticked, fall back to the first four so the section isn't empty.
const featuredEquipment = computed(() => {
  const picked = featuredEquipmentItems()
  return picked.length ? picked : allEquipment().slice(0, 4)
})

const steps = [
  { title: 'home.how1Title', text: 'home.how1Text' },
  { title: 'home.how2Title', text: 'home.how2Text' },
  { title: 'home.how3Title', text: 'home.how3Text' },
]

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
})

// FAQPage on the page node; FaqSection emits the Question nodes it holds.
useSchemaOrg([
  defineWebPage({ '@type': faqItems.length ? ['WebPage', 'FAQPage'] : 'WebPage' }),
])
</script>
