<template>
  <div>
    <div class="wrap section">
      <SectionHeading as="h1" :kicker="t('catalogue.kicker')" :title="t('catalogue.title')" :intro="t('catalogue.intro')" />

      <!-- Category pills are real links to the keyword landing pages
           (/vehicles/kassabilar …), so every category view has its own URL. -->
      <div class="mt-10">
        <CategoryLinks :items="chips" :group-label="t('catalogue.kicker')" />
      </div>

      <div v-if="all().length" class="mt-10 card-grid">
        <VehicleCard v-for="v in all()" :key="v.id" :vehicle="v" />
      </div>
      <div v-else class="mt-16 text-center">
        <p class="text-bone-400">{{ t('catalogue.empty') }}</p>
        <NuxtLink :to="localePath('/contact')" class="btn-gold mt-6">
          {{ t('catalogue.emptyCta') }}
        </NuxtLink>
      </div>
    </div>

    <CtaBanner />
  </div>
</template>

<script setup lang="ts">
import type { VehicleCategory } from '~/types'
import { categories } from '~/data/categories'
import { landingForCategoryQuery, vehicleLandings } from '~/data/vehicleLandings'

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const { all } = await useVehicles()

// The old ?category= filter URLs were linked from the footer and got indexed
// as near-duplicates of this page. Each category is a real page now, so the
// query form 301s there (and unknown values simply show the full fleet).
const isCategory = (v: unknown): v is VehicleCategory =>
  typeof v === 'string' && categories.some(c => c.id === v)
if (isCategory(route.query.category)) {
  await navigateTo(localePath({ name: landingForCategoryQuery[route.query.category].routeName }), { redirectCode: 301 })
}

// Only landings that have vehicles are offered; an empty one is noindexed anyway.
const chips = computed(() => {
  const present = new Set(all().map(v => v.kind))
  return [
    { label: t('catalogue.all'), to: localePath('/vehicles'), active: true },
    ...vehicleLandings
      .filter(l => present.has(l.kind))
      .map(l => ({ label: t(`${l.key}.title`), to: localePath({ name: l.routeName }) })),
  ]
})

useSeoMeta({
  title: t('meta.vehicles.title'),
  description: t('meta.vehicles.description'),
  ogTitle: `${t('meta.vehicles.title')} · Creative Filmmaking`,
  ogDescription: t('meta.vehicles.description'),
})

const siteUrl = useRuntimeConfig().public.siteUrl
useSchemaOrg([
  defineWebPage({ '@type': 'CollectionPage' }),
  defineItemList({
    itemListElement: all().map(v => ({
      url: `${siteUrl}${localePath(`/vehicles/${v.slug}`)}`,
    })),
  }),
])
</script>
