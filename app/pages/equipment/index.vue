<template>
  <div>
    <div class="wrap section">
      <SectionHeading as="h1" :kicker="t('equipmentCatalogue.kicker')" :title="t('equipmentCatalogue.title')" :intro="t('equipmentCatalogue.intro')" />

      <!-- Category pills are real links to the keyword landing pages
           (/equipment/hitablasarar …), so every category view has its own URL. -->
      <div class="mt-10">
        <CategoryLinks :items="chips" :group-label="t('equipmentCatalogue.kicker')" />
      </div>

      <div v-if="all().length" class="mt-10 card-grid">
        <EquipmentCard v-for="e in all()" :key="e.id" :item="e" />
      </div>
      <div v-else class="mt-16 text-center">
        <p class="text-bone-400">{{ t('equipmentCatalogue.empty') }}</p>
        <NuxtLink :to="localePath('/contact')" class="btn-gold mt-6">
          {{ t('equipmentCatalogue.emptyCta') }}
        </NuxtLink>
      </div>

      <!-- SEO prose: spells out in plain words what's for rent, so search
           engines (and skimming humans) get the full picture the card grid
           alone doesn't convey. -->
      <section class="mt-20 max-w-3xl">
        <h2 class="h2">
          {{ t('equipmentCatalogue.seoTitle') }}
        </h2>
        <p class="mt-4 text-bone-400 leading-relaxed">
          {{ t('equipmentCatalogue.seoText') }}
        </p>
        <p class="mt-3 text-bone-400 leading-relaxed">
          {{ t('equipmentCatalogue.seoText2') }}
        </p>
      </section>
    </div>

    <CtaBanner />
  </div>
</template>

<script setup lang="ts">
import type { EquipmentCategory } from '~/types'
import { equipmentCategories } from '~/data/equipmentCategories'
import { equipmentLandingFor, equipmentLandings } from '~/data/equipmentLandings'

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const { all } = await useEquipment()

// Old ?category= filter URLs 301 to the category's own page (see vehicles/index.vue).
const isCategory = (v: unknown): v is EquipmentCategory =>
  typeof v === 'string' && equipmentCategories.includes(v as EquipmentCategory)
if (isCategory(route.query.category)) {
  await navigateTo(localePath({ name: equipmentLandingFor(route.query.category).routeName }), { redirectCode: 301 })
}

const chips = computed(() => {
  const present = new Set(all().map(e => e.category))
  return [
    { label: t('equipmentCatalogue.all'), to: localePath('/equipment'), active: true },
    ...equipmentLandings
      .filter(l => present.has(l.category))
      .map(l => ({ label: t(`${l.key}.title`), to: localePath({ name: l.routeName }) })),
  ]
})

useSeoMeta({
  title: t('meta.equipment.title'),
  description: t('meta.equipment.description'),
  ogTitle: `${t('meta.equipment.title')} · Creative Filmmaking`,
  ogDescription: t('meta.equipment.description'),
})

// Plain URL list (like the fleet page) — Product typing without offers would
// only trigger "invalid item" warnings in Search Console.
const siteUrl = useRuntimeConfig().public.siteUrl
useSchemaOrg([
  defineWebPage({ '@type': 'CollectionPage' }),
  defineItemList({
    itemListElement: all().map(e => ({
      url: `${siteUrl}${localePath(`/equipment/${equipmentSlug(e)}`)}`,
    })),
  }),
])
</script>
