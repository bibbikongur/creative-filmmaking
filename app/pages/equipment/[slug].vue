<template>
  <!-- One route for two kinds of page under /equipment/<slug>: a category
       landing page when the slug belongs to a category, otherwise an item. -->
  <EquipmentLandingPage v-if="category" :category="category" />

  <div v-else-if="item" class="wrap section-sm">
    <Breadcrumbs :items="crumbs" />

    <div class="mt-8 grid gap-10 lg:grid-cols-5">
      <!-- Gallery -->
      <div class="lg:col-span-3">
        <VehicleGallery :images="item.images" :alt="t('meta.vehicleTitle', { name: lt(item.name) })" fit="contain" />
      </div>

      <!-- Summary -->
      <div class="lg:col-span-2">
        <p v-if="categoryName" class="kicker">{{ categoryName }}</p>
        <!-- "til leigu" in the visible H1 — the headline matches what people
             actually search for, without polluting the item names themselves. -->
        <h1 class="h1 lg:text-4xl mt-3">
          {{ t('meta.vehicleTitle', { name: lt(item.name) }) }}
        </h1>
        <p v-if="lt(item.tagline)" class="mt-4 text-lg text-bone-400 leading-relaxed">
          {{ lt(item.tagline) }}
        </p>

        <!-- Detail copy (admin "Description"): what it is, what it is for, what comes with it. -->
        <div v-if="paragraphs.length" class="mt-6 space-y-4 text-sm text-bone-400 leading-relaxed whitespace-pre-line">
          <p v-for="(paragraph, i) in paragraphs" :key="i">{{ paragraph }}</p>
        </div>

        <!-- Highlights -->
        <template v-if="highlights.length">
          <h2 class="h4 mt-8">
            {{ t('vehicle.highlightsTitle') }}
          </h2>
          <ul class="mt-4 space-y-2.5">
            <li v-for="(h, i) in highlights" :key="i" class="flex items-start gap-3 text-sm text-bone-400">
              <svg class="w-4 h-4 mt-0.5 shrink-0 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {{ h }}
            </li>
          </ul>
        </template>

        <div class="mt-8 flex flex-col sm:flex-row gap-3">
          <a href="#request-offer" class="btn-gold flex-1">
            {{ t('common.requestOffer') }}
          </a>
          <AddToCartButton type="equipment" :id="item.id" class="flex-1" />
        </div>
      </div>
    </div>

    <!-- Offer form -->
    <div class="mt-16 max-w-3xl">
      <div id="request-offer" class="scroll-mt-28">
        <div class="panel">
          <h2 class="h3">
            {{ t('vehicle.requestTitle') }}
          </h2>
          <p class="mt-2 text-sm text-bone-400 leading-relaxed">
            {{ t('vehicle.requestIntro') }}
          </p>
          <div class="mt-7">
            <QuoteForm :interest="lt(item.name)" message-required />
          </div>
        </div>
      </div>
    </div>

    <!-- More in this category (a small category borrows from the ones that go out with it) -->
    <section v-if="related.length" class="mt-20">
      <SectionHeading
        :kicker="relatedMixed ? t('vehicle.pairsWithKicker') : categoryName"
        :title="relatedMixed ? t('vehicle.pairsWith') : t('vehicle.moreInCategory')"
      />
      <div class="mt-8 card-grid">
        <EquipmentCard v-for="e in related" :key="e.id" :item="e" :category-label="label(e.category)" />
      </div>
    </section>

    <StickyCta href="#request-offer" :label="t('common.requestOffer')" />
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

// The next three in the category's order, wrapping round: every item gets
// linked from its neighbours, not just the first three of each category.
const related = computed(() => {
  if (!item) return []
  const siblings = byCategory(item.category)
  const i = siblings.findIndex(e => e.id === item.id)
  const own = [...siblings.slice(i + 1), ...siblings.slice(0, Math.max(i, 0))].slice(0, 3)
  if (own.length === 3) return own
  // A category with fewer than three others fills up from the categories that
  // go out on the same jobs (equipmentRelated.ts), or else the ones after it.
  const order = categories().map(c => c.id)
  const at = order.indexOf(item.category)
  const neighbours = RELATED_CATEGORIES[item.category] ?? [...order.slice(at + 1), ...order.slice(0, Math.max(at, 0))]
  return [...own, ...neighbours.flatMap(id => byCategory(id))].slice(0, 3)
})
// With borrowed items the block is "pairs well with", not "more in this category".
const relatedMixed = computed(() => related.value.some(e => e.category !== item?.category))

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
