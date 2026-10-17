<template>
  <div>
    <div class="wrap section-sm">
      <Breadcrumbs :items="crumbs" />

      <div class="mt-8">
        <SectionHeading as="h1" :kicker="t('equipmentCatalogue.kicker')" :title="text(category.title) || text(category.name)" />
      </div>
      <div v-if="intro.length" class="mt-6 max-w-3xl space-y-4 text-bone-400 leading-relaxed">
        <p v-for="(paragraph, i) in intro" :key="i">{{ paragraph }}</p>
      </div>

      <div class="mt-10">
        <CategoryLinks :items="chips" :group-label="t('equipmentCatalogue.kicker')" />
      </div>

      <div v-if="items.length" class="mt-10 card-grid">
        <EquipmentCard v-for="e in items" :key="e.id" :item="e" :category-label="text(category.name)" />
      </div>
      <div v-else class="mt-16 text-center">
        <p class="text-bone-400">{{ t('equipmentCatalogue.empty') }}</p>
        <NuxtLink :to="localePath('/contact')" class="btn-gold mt-6">
          {{ t('common.requestOffer') }}
        </NuxtLink>
      </div>

      <FaqSection v-if="faqItems.length" class="mt-20" :kicker="t('faq.kicker')" :title="t('faq.title')" :items="faqItems" />
    </div>

    <CtaBanner />
  </div>
</template>

<script setup lang="ts">
import type { EquipmentCategoryDef } from '~/types'

// Shared body of every /equipment/<category> keyword page. Rendered by
// app/pages/equipment/[slug].vue when the slug belongs to a category; the
// copy comes from the category row (editable in /admin/equipment/categories).
const props = defineProps<{ category: EquipmentCategoryDef }>()

const { t } = useI18n()
const localePath = useLocalePath()
const { all, byCategory } = await useEquipment()
const { all: categories, path, text } = await useEquipmentCategories()

const items = computed(() => byCategory(props.category.id))

const intro = computed(() => props.category.intro.map(p => text(p)).filter(Boolean))

const faqItems = computed(() => props.category.faq
  .map(f => ({ q: text(f.q), a: text(f.a) }))
  .filter(f => f.q && f.a))

const chips = computed(() => {
  const present = new Set(all().map(e => e.category))
  return [
    { label: t('equipmentCatalogue.all'), to: localePath('/equipment'), active: false },
    ...categories()
      .filter(c => c.id === props.category.id || present.has(c.id))
      .map(c => ({ label: text(c.name), to: path(c), active: c.id === props.category.id })),
  ]
})

const crumbs = computed(() => [
  { label: t('nav.home'), to: localePath('/') },
  { label: t('nav.equipment'), to: localePath('/equipment') },
  { label: text(props.category.title) || text(props.category.name), to: path(props.category) },
])

const metaTitle = computed(() => text(props.category.metaTitle) || text(props.category.title) || text(props.category.name))
const metaDescription = computed(() => text(props.category.metaDescription) || intro.value[0] || t('meta.equipment.description'))

useSeoMeta({
  title: () => metaTitle.value,
  description: () => metaDescription.value,
  ogTitle: () => `${metaTitle.value} · Creative Filmmaking`,
  ogDescription: () => metaDescription.value,
  // A category with nothing in it is a thin page: keep it out of the index until it has items.
  robots: () => (items.value.length ? undefined : 'noindex, follow'),
})

const siteUrl = useRuntimeConfig().public.siteUrl
useSchemaOrg([
  defineWebPage({ '@type': faqItems.value.length ? ['CollectionPage', 'FAQPage'] : 'CollectionPage' }),
  defineItemList({
    itemListElement: items.value.map(e => ({
      url: `${siteUrl}${localePath(`/equipment/${equipmentSlug(e)}`)}`,
    })),
  }),
])
</script>
