<template>
  <!-- One route for two kinds of page under /equipment/<slug>: a category
       landing page when the slug belongs to a category, otherwise an item. -->
  <EquipmentLandingPage v-if="category" :category="category" />

  <div v-else-if="item">
    <div class="wrap pt-6 sm:pt-8 pb-14 lg:pb-20">
      <Breadcrumbs :items="crumbs" collapse />

      <ListingLayout class="mt-4 sm:mt-6">
        <template #gallery>
          <VehicleGallery :images="item.images" :alt="t('meta.vehicleTitle', { name: lt(item.name) })" fit="contain" />
        </template>

        <!-- The rail: what it is, how to get a price, and its key points -->
        <template #title>
          <!-- On a phone the back link above the photo already names the category -->
          <p v-if="categoryName" class="kicker max-sm:hidden">{{ categoryName }}</p>
          <!-- "til leigu" in the visible H1 — the headline matches what people
               actually search for, without polluting the item names themselves. The
               name carries the weight; the rental phrase follows it a step quieter. -->
          <i18n-t keypath="meta.vehicleTitle" tag="h1" scope="global" class="h1 lg:text-3xl/[1.2] 2xl:text-4xl/[1.2] sm:mt-3 !font-medium !text-bone-400 [text-wrap:balance]">
            <template #name><span class="font-semibold text-bone-100">{{ lt(item.name) }}</span></template>
          </i18n-t>
          <p v-if="lt(item.tagline)" class="mt-3 sm:mt-4 text-lg lg:max-xl:text-base text-bone-100/85 leading-relaxed [text-wrap:pretty]">
            {{ lt(item.tagline) }}
          </p>
        </template>

        <template #quote>
          <ListingQuoteBox type="equipment" :id="item.id" />
        </template>

        <!-- Highlights: an item's figures live here (it has no spec table) -->
        <template v-if="highlights.length" #facts="{ wide }">
          <ListingHighlights :items="highlights" :wide="wide" />
        </template>

        <template #details>
          <!-- Detail copy (admin "Description"): what it is, what it is for, what comes with it. -->
          <ListingDescription v-if="paragraphs.length" :paragraphs="paragraphs" class="pt-8 border-t border-ink-700" />
          <ListingGoodToKnow type="equipment" class="pt-8 border-t border-ink-700" :class="paragraphs.length ? 'mt-10' : ''" />
        </template>
      </ListingLayout>
    </div>

    <ListingEnquiry :name="lt(item.name)" :image="item.images[0]" fit="contain" />

    <div class="wrap py-14 lg:py-20 space-y-16 lg:space-y-20">
      <!-- What goes out on the same jobs: items from the categories that travel with this one -->
      <section v-if="companions.length">
        <div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <SectionHeading :kicker="t('vehicle.pairsWithKicker')" :title="t('vehicle.pairsWith')" :intro="t('vehicle.pairsWithIntro')" />
          <NuxtLink :to="localePath('/equipment')" class="btn-outline btn-sm">
            {{ t('home.featuredEquipmentAll') }}
          </NuxtLink>
        </div>
        <CardRow class="mt-8" :count="companions.length">
          <EquipmentCard v-for="e in companions" :key="e.id" :item="e" :category-label="label(e.category)" dense accent :gallery="false" :price-note="false" sizes="xs:75vw sm:320px lg:25vw" />
        </CardRow>
      </section>

      <!-- The alternatives: more of the same category -->
      <section v-if="siblings.length">
        <div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <SectionHeading :kicker="categoryName" :title="t('vehicle.moreInCategory')" />
          <NuxtLink v-if="itemCategory" :to="path(itemCategory)" class="btn-outline btn-sm">
            {{ t('equipmentCatalogue.browser.viewCategory') }}
          </NuxtLink>
        </div>
        <CardRow class="mt-8" :count="siblings.length">
          <EquipmentCard v-for="e in siblings" :key="e.id" :item="e" dense accent :gallery="false" :price-note="false" sizes="xs:75vw sm:320px lg:25vw" />
        </CardRow>
      </section>
    </div>

    <StickyCta type="equipment" :id="item.id" :name="lt(item.name)" :image="item.images[0]" fit="contain" :hide-beside="['listing-actions', 'request-offer']" />
  </div>
</template>

<script setup lang="ts">
import type { EquipmentCategoryDef, EquipmentItem } from '~/types'
import { RELATED_CATEGORIES } from '~/data/equipmentRelated'

const { t, locale } = useI18n()
const { lt } = useLocalized()
const localePath = useLocalePath()
const route = useRoute()
const { all, byCategory } = await useEquipment()
const { equipmentPath } = useItemPaths()
const { all: categories, byId, label, path, text } = await useEquipmentCategories()

const param = route.params.slug as string

// ── 1. Category landing page? ────────────────────────────────────────────────
// Current slug in this locale → render. Current slug of the other locale or a
// former slug → 301 to the right address. (Archived categories are not in the
// public list; their old URLs fall through to the item lookup and 404, which
// the admin avoids by moving items out before archiving.)
const categoryHit = categories().find(c => c.slug.is === param || c.slug.en === param || c.previousSlugs.includes(param))
if (categoryHit && path(categoryHit) !== localePath(`/equipment/${param}`)) {
  await navigateTo(path(categoryHit), { redirectCode: 301 })
}
// The list carries names and slugs only: the landing copy comes with the category's own record.
const category = ref<EquipmentCategoryDef | undefined>(categoryHit ? (await useEquipmentCategory(categoryHit.id)).value ?? undefined : undefined)
if (categoryHit && !category.value) {
  throw createError({ statusCode: 404, statusMessage: 'Category not found', fatal: true })
}

if (category.value) {
  // Different slug per language: tell @nuxtjs/i18n so the hreflang links and
  // the language switcher point at the translated address.
  useLocalisedSlugs({ is: category.value.slug.is, en: category.value.slug.en })
}

// ── 2. Otherwise an item ─────────────────────────────────────────────────────
const found: EquipmentItem | undefined = category.value
  ? undefined
  : (all().find(e => equipmentSlug(e) === param) ?? all().find(e => e.slugEn === param) ?? all().find(e => e.id === param))
if (!category.value && !found) {
  throw createError({ statusCode: 404, statusMessage: 'Equipment not found', fatal: true })
}
const item = found!

// Reached via raw id, or via the other language's segment — 301 to this
// language's address so shared links and search engines converge on one URL.
if (item && param !== equipmentSlugFor(item, locale.value)) {
  await navigateTo(equipmentPath(item), { redirectCode: 301 })
}
if (item) {
  // Different segment per language: tell @nuxtjs/i18n so the hreflang links
  // and the language switcher point at the translated address.
  useLocalisedSlugs({ is: equipmentSlug(item), en: equipmentSlugFor(item, 'en') })
}

const itemCategory = computed(() => (item ? byId(item.category) : undefined))
const categoryName = computed(() => text(itemCategory.value?.name))

// The alternatives: the next four in the category's order, wrapping round, so
// every item is linked from its neighbours and not just the first four.
const siblings = computed(() => {
  if (!item) return []
  const own = byCategory(item.category)
  const i = own.findIndex(e => e.id === item.id)
  return [...own.slice(i + 1), ...own.slice(0, Math.max(i, 0))].slice(0, 4)
})

// What goes out with it: items from the categories that travel on the same jobs
// (equipmentRelated.ts), or else the categories after this one in the catalogue.
// One from each category in turn, starting at a point that moves with the item's
// place in its own category, so these links spread over those categories too.
const companions = computed(() => {
  if (!item) return []
  const order = categories().map(c => c.id)
  const at = order.indexOf(item.category)
  const lists = (RELATED_CATEGORIES[item.category] ?? [...order.slice(at + 1), ...order.slice(0, Math.max(at, 0))])
    .map(id => byCategory(id))
    .filter(list => list.length)
    .slice(0, 4)
  const i = Math.max(byCategory(item.category).findIndex(e => e.id === item.id), 0)
  const picked: EquipmentItem[] = []
  for (let round = 0; picked.length < 4 && round < 4; round++) {
    for (const list of lists) {
      const e = list[(i + round) % list.length]!
      if (picked.length < 4 && !picked.includes(e)) picked.push(e)
    }
  }
  return picked
})

// The list carries cards only: the description comes with the item's own record.
const fullItem = item ? await useEquipmentItem(item.id) : ref<EquipmentItem | undefined>()
const paragraphs = computed(() => {
  const description = fullItem.value?.description
  const textValue = description ? lt(description) : ''
  return textValue ? textValue.split('\n\n').map(p => p.trim()).filter(Boolean) : []
})
const highlights = computed(() => (item?.highlights ?? []).map(h => lt(h)).filter(Boolean))

// Breadcrumbs renders the trail and emits the matching BreadcrumbList JSON-LD.
// The category level links to the category's landing page.
const crumbs = computed(() => [
  { label: t('nav.home'), to: localePath('/') },
  { label: t('nav.equipment'), to: localePath('/equipment') },
  ...(itemCategory.value ? [{ label: categoryName.value, to: path(itemCategory.value) }] : []),
  ...(item ? [{ label: lt(item.name), to: equipmentPath(item) }] : []),
])

if (item) {
  const siteUrl = useRuntimeConfig().public.siteUrl
  const absImage = (src: string) => (src.startsWith('http') ? src : `${siteUrl}${src}`)
  const { ogImageUrl } = useOgImage()

  // Make sure the rental phrase and the country appear in the SERP snippet:
  // "{name} til leigu á Íslandi." (Google bolds the query terms, which lifts
  // click-through), then the tagline, then the opening of the description, in
  // whole sentences up to ~160 characters. When the lead leaves no room for
  // even one more sentence, the tagline and description go without it (the
  // title already says "til leigu").
  const metaDescription = computed(() => {
    const lead = `${t('meta.rentInIceland', { name: lt(item.name) })}.`
    const withLead = composeMetaDescription([lead, lt(item.tagline), paragraphs.value[0]])
    if (withLead.length > lead.length) return withLead
    // A tagline sentence that does not fit ends the tagline there; the rental line follows whenever it has room.
    const suffix = t('meta.forRentInIceland')
    const head = composeMetaDescription([lt(item.tagline)])
    if (!head) return t('meta.equipment.description')
    if (`${head} ${suffix}`.length <= 160) return composeMetaDescription([head, suffix, paragraphs.value[0]])
    // The whole tagline leaves no room: its last sentence gives way to the rental line.
    const shorter = composeMetaDescription([lt(item.tagline)], 160 - suffix.length - 1)
    return shorter && !shorter.endsWith('…') ? `${shorter} ${suffix}` : head
  })

  useSeoMeta({
    title: () => t('meta.vehicleTitle', { name: lt(item.name) }),
    description: () => metaDescription.value,
    ogTitle: () => `${t('meta.vehicleTitle', { name: lt(item.name) })} · Creative Filmmaking`,
    ogDescription: () => metaDescription.value,
    // Product shots are cut-outs on white: pad to 1200×630 instead of cropping.
    ogImage: ogImageUrl(item.images[0], 'contain'),
    // Restated here: setting og:image on a page drops the site-wide dimensions.
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageAlt: item.images[0] ? () => lt(item.name) : undefined,
  })

  // No Product node on purpose: Google requires offers/reviews on Product
  // markup for rich results, and prices here are offer-on-request — a Product
  // node without them just generates "invalid item" noise in Search Console.
  // primaryImageOfPage tells Google which photo belongs to THIS page, so SERP
  // thumbnails don't borrow an image from elsewhere on the site.
  useSchemaOrg([
    defineWebPage({
      '@type': 'ItemPage',
      ...(item.images[0] ? { primaryImageOfPage: absImage(item.images[0]) } : {}),
    }),
  ])
}
</script>
