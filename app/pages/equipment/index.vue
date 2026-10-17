<template>
  <div>
    <div class="wrap section">
      <SectionHeading as="h1" :kicker="t('equipmentCatalogue.kicker')" :title="t('equipmentCatalogue.title')" :intro="t('equipmentCatalogue.intro')" />

      <!-- Category pills are real links to the category landing pages
           (/equipment/hitablasarar …), so every category view has its own URL. -->
      <div class="mt-10 flex flex-wrap items-center justify-between gap-4">
        <CategoryLinks :items="chips" :group-label="t('equipmentCatalogue.kicker')" />
        <ViewToggle :model-value="view" @update:model-value="setView" />
      </div>

      <!-- One row per category, so the page reads as a catalogue rather than a wall of cards -->
      <template v-if="groups.length">
        <section v-for="group in groups" :key="group.key" class="mt-14 first:mt-10">
          <div class="flex flex-wrap items-end justify-between gap-4 pb-4 border-b border-ink-700">
            <h2 class="h3 flex items-baseline gap-3">
              {{ group.title }}
              <span class="meta normal-case tracking-normal font-sans">{{ t('equipmentCatalogue.count', group.items.length) }}</span>
            </h2>
            <NuxtLink :to="group.to" class="text-sm font-heading font-semibold uppercase tracking-wider text-gold-500 hover:text-gold-400 transition-colors inline-flex items-center gap-2">
              {{ t('catalogue.seeAll') }}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </NuxtLink>
          </div>
          <div class="mt-6" :class="view === 'list' ? 'grid gap-4' : 'card-grid'">
            <EquipmentCard v-for="e in group.items" :key="e.id" :item="e" :category-label="group.label" :layout="view === 'list' ? 'row' : 'grid'" />
          </div>
        </section>
      </template>
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
const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const { all } = await useEquipment()
const { all: categories, byId, path, text } = await useEquipmentCategories()
const { view, set: setView } = useCatalogueView('equipment', 'grid')

// Old ?category=<id> filter URLs 301 to the category's own page.
const legacy = typeof route.query.category === 'string' ? byId(route.query.category) : undefined
if (legacy) {
  await navigateTo(path(legacy), { redirectCode: 301 })
}

const present = computed(() => new Set(all().map(e => e.category)))

const chips = computed(() => [
  { label: t('equipmentCatalogue.all'), to: localePath('/equipment'), active: true },
  ...categories()
    .filter(c => present.value.has(c.id))
    .map(c => ({ label: text(c.name), to: path(c) })),
])

// Rows per category in admin order; items whose category was archived or
// removed gather in a final unnamed row so nothing disappears from the site.
const groups = computed(() => {
  const list = all()
  const rows = categories().flatMap((c) => {
    const items = list.filter(e => e.category === c.id)
    return items.length
      ? [{ key: c.id, title: text(c.title) || text(c.name), label: text(c.name), to: path(c), items }]
      : []
  })
  const known = new Set(categories().map(c => c.id))
  const rest = list.filter(e => !known.has(e.category))
  if (rest.length) rows.push({ key: 'other', title: t('equipmentCatalogue.otherGroup'), label: '', to: localePath('/equipment'), items: rest })
  return rows
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
