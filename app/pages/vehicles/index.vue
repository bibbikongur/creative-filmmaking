<template>
  <div>
    <div class="wrap section">
      <SectionHeading as="h1" :kicker="t('catalogue.kicker')" :title="t('catalogue.title')" :intro="t('catalogue.intro')" />

      <!-- Category pills are real links to the keyword landing pages
           (/vehicles/kassabilar …), so every category view has its own URL. -->
      <div class="mt-10 flex flex-wrap items-center justify-between gap-4">
        <CategoryLinks :items="chips" :group-label="t('catalogue.kicker')" />
        <ViewToggle :model-value="view" @update:model-value="setView" />
      </div>

      <!-- The full fleet, one row per type, so the page reads as a catalogue
           rather than a wall of cards. -->
      <template v-if="groups.length">
        <section v-for="group in groups" :key="group.key" class="mt-14 first:mt-10">
          <div class="flex flex-wrap items-end justify-between gap-4 pb-4 border-b border-ink-700">
            <h2 class="h3 flex items-baseline gap-3">
              {{ group.title }}
              <span class="meta normal-case tracking-normal font-sans">{{ t('catalogue.count', group.units) }}</span>
            </h2>
            <NuxtLink v-if="group.to" :to="group.to" class="text-sm font-heading font-semibold uppercase tracking-wider text-gold-500 hover:text-gold-400 transition-colors inline-flex items-center gap-2">
              {{ t('catalogue.seeAll') }}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </NuxtLink>
          </div>
          <div class="mt-6" :class="view === 'list' ? 'grid gap-4' : 'card-grid'">
            <VehicleCard v-for="v in group.items" :key="v.id" :vehicle="v" :layout="view === 'list' ? 'row' : 'grid'" />
          </div>
        </section>
      </template>
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
import type { Vehicle, VehicleCategory } from '~/types'
import { categories } from '~/data/categories'
import { landingForCategoryQuery, vehicleLandings } from '~/data/vehicleLandings'

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const { all } = await useVehicles()
const { view, set: setView } = useCatalogueView('vehicles', 'list')

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

const units = (items: Vehicle[]) => items.reduce((n, v) => n + (v.specs.units ?? 1), 0)

// Rows per vehicle type in landing order; vehicles with no landing page
// (no kind yet, or a kind without one) gather in a final "other" row.
const groups = computed(() => {
  const list = all()
  const rows = vehicleLandings.flatMap((l) => {
    const items = list.filter(v => v.kind === l.kind)
    return items.length
      ? [{ key: l.id, title: t(`${l.key}.title`), to: localePath({ name: l.routeName }), items, units: units(items) }]
      : []
  })
  const covered = new Set(vehicleLandings.map(l => l.kind))
  const rest = list.filter(v => !v.kind || !covered.has(v.kind))
  if (rest.length) rows.push({ key: 'other', title: t('catalogue.otherGroup'), to: '', items: rest, units: units(rest) })
  return rows
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
