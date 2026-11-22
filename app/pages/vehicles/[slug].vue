<template>
  <div>
    <div class="wrap pt-6 sm:pt-8 pb-14 lg:pb-20">
      <Breadcrumbs :items="crumbs" collapse />

      <ListingLayout class="mt-4 sm:mt-6">
        <template #gallery>
          <VehicleGallery :images="vehicle.images" :alt="t('meta.vehicleTitle', { name: lt(vehicle.name) })" />
        </template>

        <!-- The rail: what it is, how to get a price, and the figures -->
        <template #title>
          <!-- On a phone the back link above the photo already names the type -->
          <p class="flex flex-wrap items-center gap-x-4 gap-y-2 max-sm:mb-3" :class="units > 1 ? '' : 'max-sm:hidden'">
            <span class="kicker max-sm:hidden">{{ kindLabel }}</span>
            <span v-if="units > 1" class="inline-flex items-center border border-ink-500 px-2 py-0.5 text-xs font-medium text-bone-100 whitespace-nowrap">{{ t('catalogue.unitsAvailable', { n: units }) }}</span>
          </p>
          <!-- "til leigu" in the visible H1 — matches the search query directly. The
               name carries the weight; the rental phrase follows it a step quieter. -->
          <i18n-t keypath="meta.vehicleTitle" tag="h1" scope="global" class="h1 lg:text-3xl/[1.2] 2xl:text-4xl/[1.2] sm:mt-3 !font-medium !text-bone-400 [text-wrap:balance]">
            <template #name><span class="font-semibold text-bone-100">{{ lt(vehicle.name) }}</span></template>
          </i18n-t>
          <p class="mt-3 sm:mt-4 text-lg lg:max-xl:text-base text-bone-100/85 leading-relaxed [text-wrap:pretty]">
            {{ lt(vehicle.tagline) }}
          </p>
        </template>

        <template #quote>
          <ListingQuoteBox type="vehicle" :id="vehicle.id" :max="units > 1 ? units : undefined" />
        </template>

        <template v-if="specSplit.facts.length || (!showSpecTable && specSplit.rest.length)" #facts="{ wide }">
          <ListingFacts :facts="specSplit.facts" :more="showSpecTable ? [] : specSplit.rest" :wide="wide" />
        </template>

        <template #details>
          <!-- Scannable first: the points that are not figures, then the prose -->
          <section v-if="vehicle.highlights.length" class="pt-8 border-t border-ink-700">
            <h2 class="h3">{{ t('vehicle.highlightsTitle') }}</h2>
            <ul class="mt-5 grid gap-x-10 gap-y-3 sm:grid-cols-2">
              <li v-for="(h, i) in vehicle.highlights" :key="i" class="flex items-start gap-3 text-[15px] leading-relaxed text-bone-100/85">
                <svg class="w-4 h-4 mt-1 shrink-0 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                {{ keepUnits(lt(h)) }}
              </li>
            </ul>
          </section>

          <ListingDescription v-if="paragraphs.length" :paragraphs="paragraphs" class="mt-10 pt-8 border-t border-ink-700" />

          <!-- The full table only where it says more than the tiles beside the photo -->
          <section v-if="showSpecTable" class="mt-10 pt-8 border-t border-ink-700">
            <h2 class="h3">{{ t('vehicle.specsTitle') }}</h2>
            <div class="mt-5">
              <SpecTable :specs="vehicle.specs" :kind="vehicle.kind" />
            </div>
          </section>

          <ListingGoodToKnow type="vehicle" class="mt-10 pt-8 border-t border-ink-700" />
        </template>
      </ListingLayout>
    </div>

    <ListingEnquiry :name="lt(vehicle.name)" :image="vehicle.images[0]" />

    <div class="wrap py-14 lg:py-20 space-y-16 lg:space-y-20">
      <!-- Equipment that travels with this vehicle -->
      <section v-if="pairsWith.length">
        <div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <SectionHeading :kicker="t('vehicle.pairsWithKicker')" :title="t('vehicle.pairsWith')" :intro="t('vehicle.pairsWithIntro')" />
          <NuxtLink :to="localePath('/equipment')" class="btn-outline btn-sm">
            {{ t('home.featuredEquipmentAll') }}
          </NuxtLink>
        </div>
        <CardRow class="mt-8" :count="pairsWith.length">
          <EquipmentCard v-for="e in pairsWith" :key="e.id" :item="e" :category-label="categoryLabel(e.category)" dense accent :gallery="false" :price-note="false" sizes="xs:75vw sm:320px lg:25vw" />
        </CardRow>
      </section>

      <!-- More in this category -->
      <section v-if="related.length">
        <div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <SectionHeading :kicker="t('nav.fleet')" :title="t('catalogue.otherTitle')" />
          <NuxtLink :to="localePath('/vehicles')" class="btn-outline btn-sm">
            {{ t('home.featuredAll') }}
          </NuxtLink>
        </div>
        <CardRow class="mt-8" :count="related.length">
          <VehicleCard v-for="v in related" :key="v.id" :vehicle="v" :gallery="false" :price-note="false" sizes="xs:75vw sm:320px lg:25vw" />
        </CardRow>
      </section>
    </div>

    <StickyCta type="vehicle" :id="vehicle.id" :max="units > 1 ? units : undefined" :name="lt(vehicle.name)" :image="vehicle.images[0]" :hide-beside="['listing-actions', 'request-offer']" />
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
// vehiclePairings.ts), topped up with the featured items so there are four.
const pairsWith = computed(() => {
  const wanted = (found?.kind ? VEHICLE_PAIRINGS[found.kind] : [])
    .map(id => allEquipment().find(e => e.id === id))
    .filter((e): e is NonNullable<typeof e> => Boolean(e))
  const rest = [...featuredEquipment(), ...allEquipment()].filter(e => !wanted.includes(e))
  return [...new Set([...wanted, ...rest])].slice(0, 4)
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

const units = computed(() => vehicle.specs.units ?? 1)

// The deciding figures go on tiles beside the photo. The full table is shown only
// when it has at least three rows the tiles do not: otherwise those few rows
// follow the tiles as a line of features, and nothing is said twice.
const specRows = useSpecRows(() => vehicle.specs, () => vehicle.kind)
const specSplit = computed(() => splitSpecRows(specRows.value, vehicle.specs))
const showSpecTable = computed(() => specSplit.value.rest.length >= 3)
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
  return [...same, ...others.filter(v => !same.includes(v))].slice(0, 4)
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
