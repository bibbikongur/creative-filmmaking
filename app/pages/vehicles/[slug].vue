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
        <p class="kicker">{{ kindLabel }}</p>
        <!-- "til leigu" in the visible H1 — matches the search query directly. -->
        <h1 class="h1 lg:text-4xl mt-3">
          {{ t('meta.vehicleTitle', { name: lt(vehicle.name) }) }}
        </h1>
        <p class="mt-4 text-lg text-bone-400 leading-relaxed">
          {{ lt(vehicle.tagline) }}
        </p>

        <!-- pre-line: a paragraph may be a short list of "label: value" lines -->
        <div class="mt-6 space-y-4 text-sm text-bone-400 leading-relaxed whitespace-pre-line">
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
          <SpecTable :specs="vehicle.specs" :kind="vehicle.kind" />
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
        <EquipmentCard v-for="e in pairsWith" :key="e.id" :item="e" :category-label="categoryLabel(e.category)" />
      </div>
    </section>

    <!-- More in this category -->
    <section v-if="related.length" class="mt-20">
      <SectionHeading :kicker="t('nav.fleet')" :title="t('catalogue.otherTitle')" />
      <div class="mt-8 card-grid">
        <VehicleCard v-for="v in related" :key="v.id" :vehicle="v" class="sm:grid-rows-subgrid sm:row-span-4" />
      </div>
    </section>

    <StickyCta href="#request-offer" :label="t('common.requestOffer')" />
  </div>
</template>

<script setup lang="ts">
import { landingForKind } from '~/data/vehicleLandings'
import { VEHICLE_PAIRINGS } from '~/data/vehiclePairings'

const { t, locale } = useI18n()
const { lt } = useLocalized()
const localePath = useLocalePath()
const route = useRoute()
const { all } = await useVehicles()
const { vehiclePath } = useItemPaths()
const { featured: featuredEquipment, all: allEquipment } = await useEquipment()
const { label: categoryLabel } = await useEquipmentCategories()

// Cross-sell: the equipment that goes out with this type of vehicle (see
// vehiclePairings.ts), topped up with the featured items so there are three.
const pairsWith = computed(() => {
  const wanted = (found?.kind ? VEHICLE_PAIRINGS[found.kind] : [])
    .map(id => allEquipment().find(e => e.id === id))
    .filter((e): e is NonNullable<typeof e> => Boolean(e))
  const rest = [...featuredEquipment(), ...allEquipment()].filter(e => !wanted.includes(e))
  return [...wanted, ...rest].slice(0, 3)
})

// A vehicle answers to its slug and, when it has one, its English slug.
const param = route.params.slug as string
const found = all().find(v => v.slug === param) ?? all().find(v => v.slugEn === param)
if (!found) {
  throw createError({ statusCode: 404, statusMessage: 'Vehicle not found', fatal: true })
}
const vehicle = found

// One address per language: the other language's segment 301s to this one's.
if (param !== vehicleSlugFor(vehicle, locale.value)) {
  await navigateTo(vehiclePath(vehicle), { redirectCode: 301 })
}
// Tell @nuxtjs/i18n the segment differs per language, so the hreflang links
// and the language switcher point at the translated address.
useLocalisedSlugs({ is: vehicle.slug, en: vehicleSlugFor(vehicle, 'en') })

const kindLabel = computed(() => (vehicle.kind ? t(`catalogue.kindOne.${vehicle.kind}`) : t(`categories.${vehicle.category}`)))

// The list carries cards only: the description comes with the vehicle's own record.
const fullVehicle = await useVehicle(vehicle.id)
const paragraphs = computed(() => {
  const description = fullVehicle.value?.description
  return description ? lt(description).split('\n\n').map(p => p.trim()).filter(Boolean) : []
})

// The rest of the fleet, same type first: every vehicle page links on to others.
const related = computed(() => {
  // Same type first, then the fleet in order from this vehicle on (wrapping),
  // so every vehicle is shown on some other vehicle's page.
  const fleet = all()
  const i = fleet.findIndex(v => v.id === vehicle.id)
  const others = [...fleet.slice(i + 1), ...fleet.slice(0, Math.max(i, 0))]
  const same = others.filter(v => vehicle.kind && v.kind === vehicle.kind)
  return [...same, ...others.filter(v => !same.includes(v))].slice(0, 3)
})

// Breadcrumbs renders the trail and emits the matching BreadcrumbList JSON-LD.
// The category level links to the vehicle's keyword landing page when it has one.
const landing = landingForKind(vehicle.kind)
const crumbs = computed(() => [
  { label: t('nav.home'), to: localePath('/') },
  { label: t('nav.fleet'), to: localePath('/vehicles') },
  ...(landing ? [{ label: t(`${landing.key}.title`), to: localePath({ name: landing.routeName }) }] : []),
  { label: lt(vehicle.name), to: vehiclePath(vehicle) },
])

const siteUrl = useRuntimeConfig().public.siteUrl
const absImage = (src: string) => (src.startsWith('http') ? src : `${siteUrl}${src}`)
const { ogImageUrl } = useOgImage()

// The tagline, then as much of the description's opening as fits Google's
// ~160-character window in whole sentences.
const metaDescription = computed(() => composeMetaDescription([lt(vehicle.tagline), t('meta.deliveryLine'), paragraphs.value[0]]))

// "Til leigu" / "for rent" in the tab & SERP title — that's what people
// actually type into Google, and the bare vehicle name doesn't say it.
useSeoMeta({
  title: () => t('meta.vehicleTitle', { name: lt(vehicle.name) }),
  description: () => metaDescription.value,
  ogTitle: () => `${t('meta.vehicleTitle', { name: lt(vehicle.name) })} · Creative Filmmaking`,
  ogDescription: () => metaDescription.value,
  // A real 1200×630 crop, so the site-wide og:image:width/height are true here too.
  ogImage: ogImageUrl(vehicle.images[0], 'cover'),
  // Restated here: setting og:image on a page drops the site-wide dimensions.
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt: vehicle.images[0] ? () => lt(vehicle.name) : undefined,
})

// Schema.org values for the spec enums (its own enumeration where one exists).
const DRIVE = {
  '4x4': 'https://schema.org/FourWheelDriveConfiguration',
  '2wd': '2WD',
  '6x6': '6x6',
} as const

const vehicleNodeId = `${siteUrl}${vehiclePath(vehicle)}#vehicle`

// No offers node on purpose — pricing is offer-on-request. Raw node because
// schema-org ships no defineVehicle helper.
useSchemaOrg([
  // Pins the SERP thumbnail to this vehicle's own photo.
  defineWebPage({
    '@type': 'ItemPage',
    // The page is about this vehicle.
    'mainEntity': { '@id': vehicleNodeId },
    ...(vehicle.images[0] ? { primaryImageOfPage: absImage(vehicle.images[0]) } : {}),
  }),
  {
    '@type': 'Vehicle',
    '@id': vehicleNodeId,
    name: lt(vehicle.name),
    description: lt(vehicle.tagline),
    url: `${siteUrl}${vehiclePath(vehicle)}`,
    image: vehicle.images.map(absImage),
    ...(vehicle.make ? { brand: { '@type': 'Brand', name: vehicle.make } } : {}),
    ...(vehicle.model ? { model: vehicle.model } : {}),
    ...(vehicle.modelYear ? { vehicleModelDate: String(vehicle.modelYear) } : {}),
    ...(vehicle.specs.drivetrain ? { driveWheelConfiguration: DRIVE[vehicle.specs.drivetrain] } : {}),
    ...(vehicle.specs.seats ? { seatingCapacity: vehicle.specs.seats } : {}),
    ...(vehicle.specs.fuel ? { fuelType: t(`vehicle.specs.${vehicle.specs.fuel}`) } : {}),
    ...(vehicle.specs.transmission ? { vehicleTransmission: t(`vehicle.specs.${vehicle.specs.transmission}`) } : {}),
    ...(vehicle.specs.payloadKg ? { payload: { '@type': 'QuantitativeValue', 'value': vehicle.specs.payloadKg, 'unitCode': 'KGM' } } : {}),
    ...(vehicle.specs.towingCapacityKg ? { trailerWeight: { '@type': 'QuantitativeValue', 'value': vehicle.specs.towingCapacityKg, 'unitCode': 'KGM' } } : {}),
  },
])
</script>
