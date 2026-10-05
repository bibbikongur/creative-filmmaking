<template>
  <div class="wrap section-sm">
    <Breadcrumbs :items="crumbs" />

    <div class="mt-8 grid gap-10 lg:grid-cols-5">
      <!-- Gallery -->
      <div class="lg:col-span-3">
        <VehicleGallery :images="vehicle.images" :alt="t('meta.vehicleTitle', { name: lt(vehicle.name) })" />
      </div>

      <!-- Summary -->
      <div class="lg:col-span-2">
        <p class="kicker">{{ t(`categories.${vehicle.category}`) }}</p>
        <!-- "til leigu" in the visible H1 — matches the search query directly. -->
        <h1 class="h1 lg:text-4xl mt-3">
          {{ t('meta.vehicleTitle', { name: lt(vehicle.name) }) }}
        </h1>
        <p class="mt-4 text-lg text-bone-400 leading-relaxed">
          {{ lt(vehicle.tagline) }}
        </p>

        <div class="mt-6 space-y-4 text-sm text-bone-400 leading-relaxed">
          <p v-for="(paragraph, i) in paragraphs" :key="i">{{ paragraph }}</p>
        </div>

        <!-- Highlights -->
        <h2 class="h4 mt-8">
          {{ t('vehicle.highlightsTitle') }}
        </h2>
        <ul class="mt-4 space-y-2.5">
          <li v-for="(h, i) in vehicle.highlights" :key="i" class="flex items-start gap-3 text-sm text-bone-400">
            <svg class="w-4 h-4 mt-0.5 shrink-0 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            {{ lt(h) }}
          </li>
        </ul>

        <div class="mt-8 flex flex-col sm:flex-row gap-3">
          <a href="#request-offer" class="btn-gold flex-1">
            {{ t('common.requestOffer') }}
          </a>
          <AddToCartButton type="vehicle" :id="vehicle.id" class="flex-1" />
        </div>
      </div>
    </div>

    <!-- Specs + offer form -->
    <div class="mt-16 grid gap-12 lg:grid-cols-5">
      <div class="lg:col-span-2">
        <h2 class="h3">
          {{ t('vehicle.specsTitle') }}
        </h2>
        <div class="mt-6">
          <SpecTable :specs="vehicle.specs" />
        </div>
      </div>

      <div id="request-offer" class="lg:col-span-3 scroll-mt-28">
        <div class="panel">
          <h2 class="h3">
            {{ t('vehicle.requestTitle') }}
          </h2>
          <p class="mt-2 text-sm text-bone-400 leading-relaxed">
            {{ t('vehicle.requestIntro') }}
          </p>
          <div class="mt-7">
            <QuoteForm :interest="lt(vehicle.name)" message-required />
          </div>
        </div>
      </div>
    </div>

    <!-- Equipment that travels with this vehicle -->
    <section v-if="pairsWith.length" class="mt-20">
      <div class="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading :kicker="t('vehicle.pairsWithKicker')" :title="t('vehicle.pairsWith')" :intro="t('vehicle.pairsWithIntro')" />
        <NuxtLink :to="localePath('/equipment')" class="btn-outline btn-sm">
          {{ t('home.featuredEquipmentAll') }}
        </NuxtLink>
      </div>
      <div class="mt-8 card-grid">
        <EquipmentCard v-for="e in pairsWith" :key="e.id" :item="e" />
      </div>
    </section>

    <!-- More in this category -->
    <section v-if="related.length" class="mt-20">
      <SectionHeading :kicker="t(`categories.${vehicle.category}`)" :title="t('vehicle.moreInCategory')" />
      <div class="mt-8 card-grid">
        <VehicleCard v-for="v in related" :key="v.id" :vehicle="v" />
      </div>
    </section>

    <StickyCta href="#request-offer" :label="t('common.requestOffer')" />
  </div>
</template>

<script setup lang="ts">
import { landingForKind } from '~/data/vehicleLandings'

const { t } = useI18n()
const { lt } = useLocalized()
const localePath = useLocalePath()
const route = useRoute()
const { bySlug, byCategory } = await useVehicles()
const { featured: featuredEquipment, all: allEquipment } = await useEquipment()

// Cross-sell: the equipment people most often add to a vehicle (featured
// items first, otherwise the first three in the catalogue).
const pairsWith = computed(() => {
  const picked = featuredEquipment()
  return (picked.length ? picked : allEquipment()).slice(0, 3)
})

const found = bySlug(route.params.slug as string)
if (!found) {
  throw createError({ statusCode: 404, statusMessage: 'Vehicle not found', fatal: true })
}
const vehicle = found

const paragraphs = computed(() => lt(vehicle.description).split('\n\n'))

const related = computed(() =>
  byCategory(vehicle.category).filter(v => v.slug !== vehicle.slug).slice(0, 3),
)

// Breadcrumbs renders the trail and emits the matching BreadcrumbList JSON-LD.
// The category level links to the vehicle's keyword landing page when it has one.
const landing = landingForKind(vehicle.kind)
const crumbs = computed(() => [
  { label: t('nav.home'), to: localePath('/') },
  { label: t('nav.fleet'), to: localePath('/vehicles') },
  ...(landing ? [{ label: t(`${landing.key}.title`), to: localePath({ name: landing.routeName }) }] : []),
  { label: lt(vehicle.name), to: localePath(`/vehicles/${vehicle.slug}`) },
])

const siteUrl = useRuntimeConfig().public.siteUrl
const absImage = (src: string) => (src.startsWith('http') ? src : `${siteUrl}${src}`)
const { ogImageUrl } = useOgImage()

// Tagline alone is too thin for a snippet; pad it with the opening of the
// description and trim to Google's ~160-character display window.
const metaDescription = computed(() => {
  const full = `${lt(vehicle.tagline)} ${lt(vehicle.description).split('\n\n')[0] ?? ''}`.trim()
  return full.length > 160 ? `${full.slice(0, 157).trimEnd()}…` : full
})

// "Til leigu" / "for rent" in the tab & SERP title — that's what people
// actually type into Google, and the bare vehicle name doesn't say it.
useSeoMeta({
  title: () => t('meta.vehicleTitle', { name: lt(vehicle.name) }),
  description: () => metaDescription.value,
  ogTitle: () => `${t('meta.vehicleTitle', { name: lt(vehicle.name) })} · Creative Filmmaking`,
  ogDescription: () => lt(vehicle.tagline),
  // A real 1200×630 crop, so the site-wide og:image:width/height are true here too.
  ogImage: ogImageUrl(vehicle.images[0], 'cover'),
  ogImageAlt: vehicle.images[0] ? () => lt(vehicle.name) : undefined,
})

// No offers node on purpose — pricing is offer-on-request. Raw node because
// schema-org ships no defineVehicle helper.
useSchemaOrg([
  // Pins the SERP thumbnail to this vehicle's own photo.
  ...(vehicle.images[0]
    ? [defineWebPage({ primaryImageOfPage: absImage(vehicle.images[0]) })]
    : []),
  {
    '@type': 'Vehicle',
    name: lt(vehicle.name),
    description: lt(vehicle.tagline),
    image: vehicle.images.map(absImage),
    ...(vehicle.specs.seats ? { seatingCapacity: vehicle.specs.seats } : {}),
    ...(vehicle.specs.fuel ? { fuelType: vehicle.specs.fuel } : {}),
    ...(vehicle.specs.transmission ? { vehicleTransmission: vehicle.specs.transmission } : {}),
  },
])
</script>
