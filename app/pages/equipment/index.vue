<template>
  <div>
    <CatalogueHead
      :kicker="t('equipmentCatalogue.kicker')"
      :title="t('equipmentCatalogue.title')"
      :lead="t('equipmentCatalogue.browser.lead')"
      :note="t('equipmentCatalogue.browser.leadNote')"
      :intro="t('equipmentCatalogue.intro')"
      :steps-title="t('equipmentCatalogue.browser.stepsTitle')"
      :steps="steps"
    />

    <EquipmentBrowser>
      <!-- SEO prose: spells out in plain words what's for rent, so search
           engines (and skimming humans) get the full picture the card grid
           alone doesn't convey. -->
      <section class="mt-14 lg:mt-16 pt-10 border-t border-ink-800 max-w-3xl">
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
    </EquipmentBrowser>

    <CtaBanner :title="t('equipmentCatalogue.browser.ctaTitle')" :text="t('equipmentCatalogue.browser.ctaText')" :button="t('nav.contact')" />
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const { all } = await useEquipment()
const { equipmentPath } = useItemPaths()
const { byId, path } = await useEquipmentCategories()

const steps = computed(() => [0, 1, 2].map(i => ({
  title: t(`equipmentCatalogue.browser.steps[${i}].title`),
  text: t(`equipmentCatalogue.browser.steps[${i}].text`),
})))

// Old ?category=<id> filter URLs 301 to the category's own page.
const legacy = typeof route.query.category === 'string' ? byId(route.query.category) : undefined
if (legacy) {
  await navigateTo(path(legacy), { redirectCode: 301 })
}

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
      url: `${siteUrl}${equipmentPath(e)}`,
    })),
  }),
])
</script>
