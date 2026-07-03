<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
    <!-- Breadcrumb -->
    <nav class="text-xs uppercase tracking-widest text-bone-400">
      <NuxtLink :to="localePath('/vehicles')" class="hover:text-gold-400 transition-colors">
        {{ t('nav.fleet') }}
      </NuxtLink>
      <span class="mx-2 text-ink-500">/</span>
      <span class="text-gold-500">{{ t(`categories.${vehicle.category}`) }}</span>
    </nav>

    <div class="mt-8 grid gap-10 lg:grid-cols-5">
      <!-- Gallery -->
      <div class="lg:col-span-3">
        <VehicleGallery :images="vehicle.images" :alt="lt(vehicle.name)" />
      </div>

      <!-- Summary -->
      <div class="lg:col-span-2">
        <p class="kicker">{{ t(`categories.${vehicle.category}`) }}</p>
        <h1 class="mt-3 text-3xl sm:text-4xl font-semibold uppercase tracking-wide text-bone-100">
          {{ lt(vehicle.name) }}
        </h1>
        <p class="mt-3 text-lg text-bone-400 leading-relaxed">
          {{ lt(vehicle.tagline) }}
        </p>

        <div class="mt-6 space-y-4 text-sm text-bone-400 leading-relaxed">
          <p v-for="(paragraph, i) in paragraphs" :key="i">{{ paragraph }}</p>
        </div>

        <!-- Highlights -->
        <h2 class="mt-8 text-sm font-heading font-semibold uppercase tracking-widest text-bone-100">
          {{ t('vehicle.highlightsTitle') }}
        </h2>
        <ul class="mt-4 space-y-2.5">
          <li v-for="(h, i) in vehicle.highlights" :key="i" class="flex items-start gap-3 text-sm text-bone-400">
            <svg class="w-4 h-4 mt-0.5 shrink-0 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            {{ lt(h) }}
          </li>
        </ul>

        <a href="#request-offer" class="btn-gold w-full mt-8">
          {{ t('common.requestOffer') }}
        </a>
      </div>
    </div>

    <!-- Specs + offer form -->
    <div class="mt-16 grid gap-12 lg:grid-cols-5">
      <div class="lg:col-span-2">
        <h2 class="text-2xl font-semibold uppercase tracking-wide text-bone-100">
          {{ t('vehicle.specsTitle') }}
        </h2>
        <div class="mt-6">
          <SpecTable :specs="vehicle.specs" />
        </div>
      </div>

      <div id="request-offer" class="lg:col-span-3 scroll-mt-28">
        <div class="bg-ink-800 border border-ink-700 p-6 sm:p-8">
          <h2 class="text-2xl font-semibold uppercase tracking-wide text-bone-100">
            {{ t('vehicle.requestTitle') }}
          </h2>
          <p class="mt-2 text-sm text-bone-400 leading-relaxed">
            {{ t('vehicle.requestIntro') }}
          </p>
          <div class="mt-7">
            <RequestOfferForm :vehicle="vehicle.slug" />
          </div>
        </div>
      </div>
    </div>

    <!-- More in this category -->
    <section v-if="related.length" class="mt-20">
      <SectionHeading :kicker="t(`categories.${vehicle.category}`)" :title="t('vehicle.moreInCategory')" />
      <div class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <VehicleCard v-for="v in related" :key="v.id" :vehicle="v" />
      </div>
    </section>

    <!-- Sticky mobile CTA -->
    <div class="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-ink-950/90 backdrop-blur border-t border-ink-800 p-3">
      <a href="#request-offer" class="btn-gold w-full !py-3">
        {{ t('common.requestOffer') }}
      </a>
    </div>
    <div class="h-16 lg:hidden" aria-hidden="true" />
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { lt } = useLocalized()
const localePath = useLocalePath()
const route = useRoute()
const { bySlug, byCategory } = useVehicles()

const found = bySlug(route.params.slug as string)
if (!found) {
  throw createError({ statusCode: 404, statusMessage: 'Vehicle not found', fatal: true })
}
const vehicle = found

const paragraphs = computed(() => lt(vehicle.description).split('\n\n'))

const related = computed(() =>
  byCategory(vehicle.category).filter(v => v.slug !== vehicle.slug).slice(0, 3),
)

useSeoMeta({
  title: () => lt(vehicle.name),
  description: () => lt(vehicle.tagline),
  ogTitle: () => `${lt(vehicle.name)} · Creative Filmmaking`,
  ogDescription: () => lt(vehicle.tagline),
  ogImage: vehicle.images[0],
})

// No offers node on purpose — pricing is offer-on-request. Raw node because
// schema-org ships no defineVehicle helper.
useSchemaOrg([
  {
    '@type': 'Vehicle',
    name: lt(vehicle.name),
    description: lt(vehicle.tagline),
    image: vehicle.images,
  },
  defineBreadcrumb({
    itemListElement: [
      { name: t('nav.home'), item: localePath('/') },
      { name: t('nav.fleet'), item: localePath('/vehicles') },
      { name: lt(vehicle.name), item: localePath(`/vehicles/${vehicle.slug}`) },
    ],
  }),
])
</script>
