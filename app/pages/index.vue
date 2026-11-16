<template>
  <div>
    <HeroSection :image="heroImage" :steps="steps" />

    <!-- The fleet: types as links, the featured vehicles as cards -->
    <section class="wrap pt-12 pb-10 lg:pt-16 lg:pb-12">
      <div class="flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
        <SectionHeading :kicker="t('nav.fleet')" :title="t('home.featuredTitle')" />
        <NuxtLink :to="localePath('/vehicles')" class="max-sm:hidden inline-flex items-center gap-2 sm:mb-1 text-sm font-medium text-bone-100 underline decoration-ink-500 underline-offset-4 hover:decoration-bone-100 transition-colors">
          {{ t('home.featuredAll') }}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </NuxtLink>
      </div>
      <nav class="mt-5 -mx-4 sm:mx-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" :aria-label="t('home.browseTypes')">
        <ul class="flex gap-2 px-4 sm:px-0 w-max sm:w-auto sm:flex-wrap">
          <li v-for="link in typeLinks" :key="link.label">
            <NuxtLink :to="link.to" class="inline-flex items-center min-h-[2.75rem] sm:min-h-[2.25rem] px-3.5 border border-ink-700 text-[13px] font-medium text-bone-400 whitespace-nowrap hover:border-ink-400 hover:text-bone-100 transition-colors">
              {{ link.label }}
            </NuxtLink>
          </li>
        </ul>
      </nav>
      <!-- Below lg: one sideways row with the next card peeking in and a position
           marker. From lg: four across, their slots on shared rows. -->
      <div
        ref="fleetRow"
        class="mt-6 -mx-4 sm:-mx-6 lg:mx-0 overflow-x-auto lg:overflow-visible snap-x snap-mandatory scroll-px-4 sm:scroll-px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        @scroll.passive="onFleetScroll"
      >
        <div class="flex gap-3 sm:gap-4 px-4 sm:px-6 py-0.5 lg:p-0 lg:grid lg:grid-cols-4 xl:gap-5">
          <VehicleCard
            v-for="v in featuredVehicles"
            :key="v.id"
            :vehicle="v"
            :gallery="false"
            class="max-lg:w-[78vw] max-lg:sm:w-[19rem] max-lg:shrink-0 max-lg:snap-start lg:grid-rows-subgrid lg:row-span-4"
            sizes="xs:80vw sm:320px lg:25vw"
          />
        </div>
      </div>
      <p class="lg:hidden mt-4 flex items-center gap-4">
        <span class="flex items-center gap-2 sm:mx-auto" role="img" :aria-label="t('home.rowPosition', { n: fleetIndex + 1, total: featuredVehicles.length })">
          <span
            v-for="(_, n) in featuredVehicles"
            :key="n"
            class="block h-1 transition-all"
            :class="n === fleetIndex ? 'w-6 bg-bone-100' : 'w-3 bg-ink-500'"
          />
        </span>
        <NuxtLink :to="localePath('/vehicles')" class="sm:hidden ml-auto inline-flex items-center gap-2 min-h-[2.75rem] text-sm font-medium text-bone-100 underline decoration-ink-500 underline-offset-4">
          {{ t('home.featuredAll') }}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </NuxtLink>
      </p>
    </section>

    <!-- Equipment: categories as links, the featured items as the catalogue's own cards -->
    <section v-if="featuredEquipment.length" class="wrap pt-6 pb-8 lg:pt-8 lg:pb-10">
      <div class="border-t border-ink-800 pt-10 lg:pt-12">
        <div class="flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
          <SectionHeading :kicker="t('home.featuredEquipmentKicker')" :title="t('home.featuredEquipmentTitle')" />
          <NuxtLink :to="localePath('/equipment')" class="max-sm:hidden inline-flex items-center gap-2 sm:mb-1 text-sm font-medium text-bone-100 underline decoration-ink-500 underline-offset-4 hover:decoration-bone-100 transition-colors">
            {{ t('home.featuredEquipmentAll') }}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </NuxtLink>
        </div>
        <nav class="mt-5 -mx-4 sm:mx-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" :aria-label="t('home.browseCategories')">
          <ul class="flex gap-2 px-4 sm:px-0 w-max sm:w-auto sm:flex-wrap">
            <li v-for="link in categoryLinks" :key="link.to">
              <NuxtLink :to="link.to" class="inline-flex items-center min-h-[2.75rem] sm:min-h-[2.25rem] px-3.5 xl:px-3 border border-ink-700 text-[13px] font-medium text-bone-400 whitespace-nowrap hover:border-ink-400 hover:text-bone-100 transition-colors">
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </nav>
        <div
          ref="equipmentRow"
          class="mt-6 sm:max-lg:-mx-6 sm:max-lg:overflow-x-auto sm:max-lg:snap-x sm:max-lg:snap-mandatory sm:max-lg:scroll-px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          @scroll.passive="onEquipmentScroll"
        >
          <div class="grid grid-cols-2 gap-3 sm:max-lg:flex sm:max-lg:gap-4 sm:max-lg:px-6 sm:max-lg:py-0.5 lg:grid-cols-4 lg:gap-4 xl:gap-5">
            <EquipmentCard
              v-for="e in featuredEquipment"
              :key="e.id"
              :item="e"
              sizes="xs:50vw sm:320px lg:25vw"
              dense
              accent
              :gallery="false"
              class="max-sm:grid-rows-subgrid max-sm:row-span-4 max-lg:sm:w-[19rem] max-lg:sm:shrink-0 max-lg:sm:snap-start lg:grid-rows-subgrid lg:row-span-4"
            />
          </div>
        </div>
        <p class="hidden sm:max-lg:flex mt-4 items-center justify-center gap-2" role="img" :aria-label="t('home.rowPosition', { n: equipmentIndex + 1, total: featuredEquipment.length })">
          <span
            v-for="(_, n) in featuredEquipment"
            :key="n"
            class="block h-1 transition-all"
            :class="n === equipmentIndex ? 'w-6 bg-bone-100' : 'w-3 bg-ink-500'"
          />
        </p>
        <p class="sm:hidden mt-3 flex justify-end">
          <NuxtLink :to="localePath('/equipment')" class="inline-flex items-center gap-2 min-h-[2.75rem] text-sm font-medium text-bone-100 underline decoration-ink-500 underline-offset-4">
            {{ t('home.featuredEquipmentAll') }}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </NuxtLink>
        </p>
      </div>
    </section>

    <!-- Under both catalogues: what is shown is not all there is. Said where a
         visitor who has just looked and not found it will see it. -->
    <section class="wrap pb-14 lg:pb-20">
      <div class="border border-ink-700 border-l-2 border-l-gold-500 bg-ink-900 p-5 sm:p-6 lg:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-x-10 gap-y-5">
        <div class="max-w-2xl">
          <h2 class="h4">{{ t('home.missingTitle') }}</h2>
          <p class="mt-2 text-sm leading-relaxed text-bone-400">{{ t('home.missingText') }}</p>
        </div>
        <div class="flex flex-wrap items-center gap-x-6 gap-y-3 md:shrink-0">
          <a :href="`tel:${contact.phone.replace(/\s/g, '')}`" class="inline-flex items-center min-h-[2.75rem] text-sm font-medium text-bone-100 underline decoration-ink-500 underline-offset-4 hover:decoration-bone-100 transition-colors whitespace-nowrap">{{ contact.phone }}</a>
          <NuxtLink :to="localePath('/contact')" class="btn-outline btn-sm max-sm:min-h-[2.75rem] whitespace-nowrap">
            {{ t('nav.contact') }}
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Why us: a real photograph of the fleet at work, and four claims that are
         stated nowhere else on the page -->
    <section class="bg-ink-900 border-y border-ink-800">
      <div class="wrap py-14 lg:py-20 lg:grid lg:grid-cols-12 lg:gap-14 lg:items-stretch">
        <div class="lg:col-span-5 xl:col-span-6 relative overflow-hidden aspect-[3/2] sm:aspect-[2/1] lg:aspect-[4/3] lg:self-center xl:aspect-auto xl:self-stretch xl:min-h-[24rem] bg-ink-800">
          <NuxtImg
            src="/images/home-field.jpg"
            :alt="t('home.photoAlt')"
            class="absolute inset-0 w-full h-full object-cover object-[58%_60%]"
            sizes="xs:100vw lg:50vw"
            format="webp"
            loading="lazy"
          />
        </div>
        <div class="mt-10 lg:mt-0 lg:col-span-7 xl:col-span-6">
          <p class="kicker">{{ t('home.whyKicker') }}</p>
          <h2 class="mt-3 font-heading font-semibold uppercase tracking-wide text-bone-100 text-3xl/[1.2] sm:text-4xl/[1.2] [text-wrap:balance]">{{ t('home.whyTitle') }}</h2>
          <p class="mt-4 text-bone-400 leading-relaxed max-w-xl">{{ t('home.whyIntro') }}</p>
          <dl class="mt-6 border-t border-ink-700">
            <div v-for="(item, i) in whyItems" :key="i" class="grid sm:grid-cols-[13rem_1fr] gap-x-6 gap-y-1 border-b border-ink-700 py-4">
              <dt class="h4 leading-snug">{{ t(item.title) }}</dt>
              <dd class="text-sm text-bone-400 leading-relaxed">{{ t(item.text) }}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>

    <!-- FAQ: the pre-sales questions every enquiry starts with, answered in
         crawlable HTML (and as schema.org Question nodes). Beside it, the people. -->
    <section v-if="faqItems.length" class="wrap py-14 lg:py-20">
      <div class="lg:grid lg:grid-cols-12 lg:gap-14 lg:items-start">
        <FaqSection class="lg:col-span-8" :kicker="t('faq.kicker')" :title="t('faq.title')" :items="faqItems" open-first />
        <aside class="mt-10 lg:mt-0 lg:col-span-4 lg:sticky lg:top-28 border border-ink-700 bg-ink-900 p-6">
          <h2 class="h4">{{ t('home.contactTitle') }}</h2>
          <p class="mt-2 text-sm leading-relaxed text-bone-400">{{ t('home.contactText') }}</p>
          <dl class="mt-5 divide-y divide-ink-700 border-y border-ink-700 text-sm">
            <div class="flex items-baseline justify-between gap-4 py-3">
              <dt class="text-xs uppercase tracking-widest text-bone-400">{{ t('contact.phoneLabel') }}</dt>
              <dd><a :href="`tel:${contact.phone.replace(/\s/g, '')}`" class="font-medium text-bone-100 underline decoration-ink-500 underline-offset-4 hover:decoration-bone-100 transition-colors">{{ contact.phone }}</a></dd>
            </div>
            <div class="flex items-baseline justify-between gap-4 py-3">
              <dt class="text-xs uppercase tracking-widest text-bone-400">{{ t('contact.emailLabel') }}</dt>
              <dd class="min-w-0"><a :href="`mailto:${contact.email}`" class="font-medium text-bone-100 underline decoration-ink-500 underline-offset-4 hover:decoration-bone-100 transition-colors break-all">{{ contact.email }}</a></dd>
            </div>
            <div class="flex items-baseline justify-between gap-4 py-3">
              <dt class="text-xs uppercase tracking-widest text-bone-400">{{ t('contact.addressLabel') }}</dt>
              <dd class="text-right text-bone-100">{{ contact.address }}</dd>
            </div>
          </dl>
          <NuxtLink :to="localePath('/contact')" class="btn-outline btn-sm w-full mt-5 max-sm:min-h-[2.75rem]">
            {{ t('nav.contact') }}
          </NuxtLink>
        </aside>
      </div>
    </section>

    <CtaBanner image="/images/home-road.jpg" :title="t('home.closeTitle')" :text="t('home.closeText')" />
    <QuoteBar />
  </div>
</template>

<script setup lang="ts">
import { vehicleLandings } from '~/data/vehicleLandings'

const { t } = useI18n()
const localePath = useLocalePath()
const { featured, all } = await useVehicles()
const { faq } = useFaq()
const faqItems = faq('faq.home')
const { all: allEquipment, featured: featuredEquipmentItems } = await useEquipment()
const { all: equipmentCategories, path: categoryPath, text: categoryText } = await useEquipmentCategories()
const contact = useRuntimeConfig().public.contact

// Cinematic still of a shoot on an Icelandic road (public/images/hero.jpg). If it is
// ever removed, the first featured vehicle photo stands in (HeroSection darkens it).
const HERO_IMAGE: string | undefined = '/images/hero.jpg'
const heroImage = computed(() => HERO_IMAGE ?? featured()[0]?.images[0] ?? all().find(v => v.images[0])?.images[0])

// Items ticked "featured" in the admin fill the home section (first four);
// until any are ticked, fall back to the first four so the section isn't empty.
const featuredEquipment = computed(() => {
  const picked = featuredEquipmentItems()
  return (picked.length ? picked : allEquipment()).slice(0, 4)
})

// Up to four, so the row is whole at every width.
const featuredVehicles = computed(() => {
  const picked = featured()
  return (picked.length ? picked : all()).slice(0, 4)
})

// Types and categories that have something in them, as links to their own pages.
const typeLinks = computed(() => vehicleLandings
  .filter(l => all().some(v => v.kind === l.kind))
  .map(l => ({ label: t(`catalogue.kinds.${l.kind}`), to: localePath({ name: l.routeName }) })))

const categoryLinks = computed(() => equipmentCategories().flatMap((c) => {
  const count = allEquipment().filter(e => e.category === c.id).length
  return count ? [{ label: categoryText(c.name), to: categoryPath(c), count }] : []
}))

const steps = computed(() => [1, 2, 3].map(n => ({
  title: t(`home.how${n}Title`),
  text: t(`home.how${n}Text`),
})))

// Sideways rows of cards (fleet below lg, equipment on tablets): which card is at the left edge
const rowIndex = (row: HTMLElement | null, count: number) => {
  const first = row?.querySelector<HTMLElement>('article')
  if (!row || !first) return 0
  const stepPx = first.offsetWidth + 14
  const atEnd = row.scrollLeft + row.clientWidth >= row.scrollWidth - 4
  return atEnd ? count - 1 : Math.min(count - 1, Math.round(row.scrollLeft / stepPx))
}
const fleetRow = ref<HTMLElement | null>(null)
const fleetIndex = ref(0)
const onFleetScroll = () => {
  fleetIndex.value = rowIndex(fleetRow.value, featuredVehicles.value.length)
}
const equipmentRow = ref<HTMLElement | null>(null)
const equipmentIndex = ref(0)
const onEquipmentScroll = () => {
  equipmentIndex.value = rowIndex(equipmentRow.value, featuredEquipment.value.length)
}

const whyItems = [1, 2, 3, 4].map(n => ({ title: `home.why${n}Title`, text: `home.why${n}Text` }))

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
