<template>
  <div>
    <CatalogueHead
      :kicker="t('catalogue.kicker')"
      :title="t('catalogue.title')"
      :lead="t('equipmentCatalogue.browser.lead')"
      :note="t('equipmentCatalogue.browser.leadNote')"
      :intro="t('catalogue.intro')"
      :steps-title="t('equipmentCatalogue.browser.stepsTitle')"
      :steps="steps"
    />

    <FleetBrowser />

    <CtaBanner />
  </div>
</template>

<script setup lang="ts">
import type { VehicleCategory } from '~/types'
import { categories } from '~/data/categories'
import { landingForCategoryQuery } from '~/data/vehicleLandings'

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

const steps = computed(() => [0, 1, 2].map(n => ({
  title: t(`catalogue.steps[${n}].title`),
  text: t(`catalogue.steps[${n}].text`),
})))

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
