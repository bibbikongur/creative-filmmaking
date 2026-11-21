<template>
  <div>
    <!-- Short head so the items are in the first screen; the rest of the
         category copy follows the catalogue. -->
    <header class="bg-ink-900 bg-hero-vignette border-b border-ink-800">
      <div class="wrap pt-6 pb-7 lg:pt-8 lg:pb-9">
        <Breadcrumbs :items="crumbs" />
        <div class="mt-5 max-w-3xl">
          <h1 class="h1 lg:text-4xl/[1.2]">{{ text(category.title) || text(category.name) }}</h1>
          <template v-if="intro[0]">
            <p id="category-intro" class="mt-4 text-bone-400 leading-relaxed" :class="introOpen ? '' : 'max-sm:line-clamp-3'">{{ intro[0] }}</p>
            <button
              type="button"
              class="sm:hidden mt-1 min-h-[2.75rem] text-sm font-medium text-bone-100 underline decoration-ink-500 underline-offset-4"
              :aria-expanded="introOpen"
              aria-controls="category-intro"
              @click="introOpen = !introOpen"
            >
              {{ introOpen ? t('equipmentCatalogue.browser.readLess') : t('equipmentCatalogue.browser.readMore') }}
            </button>
          </template>
          <p class="mt-4 max-sm:mt-1 flex items-start gap-2.5 text-sm leading-snug text-bone-100">
            <svg class="w-4 h-4 mt-0.5 shrink-0 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ t('equipmentCatalogue.browser.lead') }} {{ t('equipmentCatalogue.browser.leadNote') }}
          </p>
        </div>
      </div>
    </header>

    <EquipmentBrowser :category="category">
      <section v-if="intro.length > 1" class="mt-14 lg:mt-16 pt-10 border-t border-ink-800 max-w-3xl">
        <h2 class="h2">{{ t('equipmentCatalogue.browser.aboutCategory') }}</h2>
        <div class="mt-4 space-y-4 text-bone-400 leading-relaxed">
          <p v-for="(paragraph, n) in intro.slice(1)" :key="n">{{ paragraph }}</p>
        </div>
      </section>
      <FaqSection v-if="faqItems.length" class="mt-14 lg:mt-16" :kicker="t('faq.kicker')" :title="t('faq.title')" :items="faqItems" />
    </EquipmentBrowser>

    <CtaBanner :title="t('equipmentCatalogue.browser.ctaTitle')" :text="t('equipmentCatalogue.browser.ctaText')" :button="t('nav.contact')" />
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
const { byCategory } = await useEquipment()
const { equipmentPath } = useItemPaths()
const { path, text } = await useEquipmentCategories()

const items = computed(() => byCategory(props.category.id))
// Phones show three lines of the intro until asked for more.
const introOpen = ref(false)

const intro = computed(() => props.category.intro.map(p => text(p)).filter(Boolean))

const faqItems = computed(() => props.category.faq
  .map(f => ({ q: text(f.q), a: text(f.a) }))
  .filter(f => f.q && f.a))

const crumbs = computed(() => [
  { label: t('nav.home'), to: localePath('/') },
  { label: t('nav.equipment'), to: localePath('/equipment') },
  // The short name, as in the trail of the category's item pages (the H1 below carries the long title).
  { label: text(props.category.name), to: path(props.category) },
])

const metaTitle = computed(() => text(props.category.metaTitle) || text(props.category.title) || text(props.category.name))
const metaDescription = computed(() => text(props.category.metaDescription) || intro.value[0] || t('meta.equipment.description'))

// The first item's photo stands for the page (share image and main image),
// not the site-wide fleet photo.
const { ogImageUrl } = useOgImage()
const firstImage = items.value.find(e => e.images[0])?.images[0]

useSeoMeta({
  ...(firstImage ? { ogImage: ogImageUrl(firstImage, 'contain'), ogImageWidth: 1200, ogImageHeight: 630, ogImageAlt: () => text(props.category.title) || text(props.category.name) } : {}),
  title: () => metaTitle.value,
  description: () => metaDescription.value,
  ogTitle: () => `${metaTitle.value} · Creative Filmmaking`,
  ogDescription: () => metaDescription.value,
})
// A category with nothing in it is a thin page: keep it out of the index until
// it has items. (Set only then: an undefined robots value here would remove
// the site-wide "index, follow, max-image-preview:large" tag from the page.)
if (!items.value.length) useSeoMeta({ robots: 'noindex, follow' })

const siteUrl = useRuntimeConfig().public.siteUrl
useSchemaOrg([
  defineWebPage({
    '@type': faqItems.value.length ? ['CollectionPage', 'FAQPage'] : 'CollectionPage',
    ...(firstImage ? { primaryImageOfPage: firstImage.startsWith('http') ? firstImage : `${siteUrl}${firstImage}` } : {}),
  }),
  defineItemList({
    itemListElement: items.value.map(e => ({
      url: `${siteUrl}${equipmentPath(e)}`,
    })),
  }),
])
</script>
