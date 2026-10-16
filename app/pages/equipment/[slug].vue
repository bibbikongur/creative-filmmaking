<template>
  <div class="wrap section-sm">
    <Breadcrumbs :items="crumbs" />

    <div class="mt-8 grid gap-10 lg:grid-cols-5">
      <!-- Gallery -->
      <div class="lg:col-span-3">
        <VehicleGallery :images="item.images" :alt="t('meta.vehicleTitle', { name: lt(item.name) })" fit="contain" />
      </div>

      <!-- Summary -->
      <div class="lg:col-span-2">
        <p class="kicker">{{ t(`equipmentCategories.${item.category}`) }}</p>
        <!-- "til leigu" in the visible H1 — the headline matches what people
             actually search for, without polluting the item names themselves. -->
        <h1 class="h1 lg:text-4xl mt-3">
          {{ t('meta.vehicleTitle', { name: lt(item.name) }) }}
        </h1>
        <p v-if="lt(item.tagline)" class="mt-4 text-lg text-bone-400 leading-relaxed">
          {{ lt(item.tagline) }}
        </p>

        <!-- Detail copy (admin "Description"): what it is, what it is for, what comes with it. -->
        <div v-if="paragraphs.length" class="mt-6 space-y-4 text-sm text-bone-400 leading-relaxed">
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

        <!-- Key facts: what every equipment item shares -->
        <h2 class="h4 mt-8">
          {{ t('equipmentCatalogue.factsTitle') }}
        </h2>
        <dl class="mt-4 divide-y divide-ink-700 border-y border-ink-700">
          <div v-for="fact in facts" :key="fact.label" class="flex items-center justify-between py-3 gap-6">
            <dt class="text-sm text-bone-400">{{ fact.label }}</dt>
            <dd class="text-sm font-medium text-bone-100 text-right">{{ fact.value }}</dd>
          </div>
        </dl>

        <div class="mt-8 flex flex-col sm:flex-row gap-3">
          <a href="#request-offer" class="btn-gold flex-1">
            {{ t('common.requestOffer') }}
          </a>
          <AddToCartButton type="equipment" :id="item.id" class="flex-1" />
        </div>
      </div>
    </div>

    <!-- Offer form -->
    <div class="mt-16 grid gap-12 lg:grid-cols-5">
      <div class="lg:col-span-2">
        <h2 class="h3">
          {{ t('equipmentCatalogue.seoTitle') }}
        </h2>
        <p class="mt-4 text-sm text-bone-400 leading-relaxed">
          {{ t('equipmentCatalogue.seoText2') }}
        </p>
      </div>
      <div id="request-offer" class="lg:col-span-3 scroll-mt-28">
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

    <!-- More in this category -->
    <section v-if="related.length" class="mt-20">
      <SectionHeading :kicker="t(`equipmentCategories.${item.category}`)" :title="t('vehicle.moreInCategory')" />
      <div class="mt-8 card-grid">
        <EquipmentCard v-for="e in related" :key="e.id" :item="e" />
      </div>
    </section>

    <StickyCta href="#request-offer" :label="t('common.requestOffer')" />
  </div>
</template>

<script setup lang="ts">
import { equipmentLandingFor } from '~/data/equipmentLandings'

const { t } = useI18n()
const { lt } = useLocalized()
const localePath = useLocalePath()
const route = useRoute()
const { all, byCategory } = await useEquipment()

const param = route.params.slug as string
const found = all().find(e => equipmentSlug(e) === param)
  ?? all().find(e => e.id === param)
if (!found) {
  throw createError({ statusCode: 404, statusMessage: 'Equipment not found', fatal: true })
}
const item = found

// Reached via raw id (or a stale slug that matches an id) — 301 to the
// canonical slug URL so shared links and search engines converge on one URL.
if (param !== equipmentSlug(item)) {
  await navigateTo(localePath(`/equipment/${equipmentSlug(item)}`), { redirectCode: 301 })
}

const related = computed(() =>
  byCategory(item.category).filter(e => e.id !== item.id).slice(0, 3),
)

const paragraphs = computed(() => {
  const text = item.description ? lt(item.description) : ''
  return text ? text.split('\n\n').map(p => p.trim()).filter(Boolean) : []
})
const highlights = computed(() => (item.highlights ?? []).map(h => lt(h)).filter(Boolean))

const facts = computed(() => [
  { label: t('equipmentCatalogue.facts.category'), value: t(`equipmentCategories.${item.category}`) },
  { label: t('equipmentCatalogue.facts.quantityLabel'), value: t('equipmentCatalogue.facts.quantity') },
  { label: t('equipmentCatalogue.facts.deliveryLabel'), value: t('equipmentCatalogue.facts.delivery') },
  { label: t('equipmentCatalogue.facts.rentalLabel'), value: t('equipmentCatalogue.facts.rental') },
])

// Breadcrumbs renders the trail and emits the matching BreadcrumbList JSON-LD.
// The category level links to the category's keyword landing page.
const landing = equipmentLandingFor(item.category)
const crumbs = computed(() => [
  { label: t('nav.home'), to: localePath('/') },
  { label: t('nav.equipment'), to: localePath('/equipment') },
  { label: t(`${landing.key}.title`), to: localePath({ name: landing.routeName }) },
  { label: lt(item.name), to: localePath(`/equipment/${equipmentSlug(item)}`) },
])

const siteUrl = useRuntimeConfig().public.siteUrl
const absImage = (src: string) => (src.startsWith('http') ? src : `${siteUrl}${src}`)
const { ogImageUrl } = useOgImage()

// Make sure the rental phrase appears in the SERP snippet: "{name} til leigu."
// followed by the first description paragraph when there is one (richer than
// the card tagline), else the tagline. Google bolds the query terms in
// descriptions, which lifts click-through. Trimmed to the ~160-char window.
const metaDescription = computed(() => {
  const title = t('meta.vehicleTitle', { name: lt(item.name) })
  const body = paragraphs.value[0] || lt(item.tagline) || t('meta.equipment.description')
  const full = /til leigu|for rent/i.test(body) ? body : `${title}. ${body}`
  return full.length > 160 ? `${full.slice(0, 157).trimEnd()}…` : full
})

useSeoMeta({
  title: () => t('meta.vehicleTitle', { name: lt(item.name) }),
  description: () => metaDescription.value,
  ogTitle: () => `${t('meta.vehicleTitle', { name: lt(item.name) })} · Creative Filmmaking`,
  ogDescription: () => metaDescription.value,
  // Product shots are cut-outs on white: pad to 1200×630 instead of cropping.
  ogImage: ogImageUrl(item.images[0], 'contain'),
  ogImageAlt: item.images[0] ? () => lt(item.name) : undefined,
})

// No Product node on purpose: Google requires offers/reviews on Product
// markup for rich results, and prices here are offer-on-request — a Product
// node without them just generates "invalid item" noise in Search Console.
// primaryImageOfPage tells Google which photo belongs to THIS page, so SERP
// thumbnails don't borrow an image from elsewhere on the site.
useSchemaOrg([
  ...(item.images[0]
    ? [defineWebPage({ primaryImageOfPage: absImage(item.images[0]) })]
    : []),
])
</script>
