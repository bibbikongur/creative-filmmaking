<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
    <!-- Breadcrumb -->
    <nav class="text-xs uppercase tracking-widest text-bone-400">
      <NuxtLink :to="localePath('/equipment')" class="hover:text-gold-400 transition-colors">
        {{ t('nav.equipment') }}
      </NuxtLink>
      <span class="mx-2 text-ink-500">/</span>
      <span class="text-gold-500">{{ t(`equipmentCategories.${item.category}`) }}</span>
    </nav>

    <div class="mt-8 grid gap-10 lg:grid-cols-5">
      <!-- Gallery -->
      <div class="lg:col-span-3">
        <VehicleGallery :images="item.images" :alt="t('meta.vehicleTitle', { name: lt(item.name) })" />
      </div>

      <!-- Summary -->
      <div class="lg:col-span-2">
        <p class="kicker">{{ t(`equipmentCategories.${item.category}`) }}</p>
        <!-- "til leigu" in the visible H1 — the headline matches what people
             actually search for, without polluting the item names themselves. -->
        <h1 class="mt-3 text-3xl sm:text-4xl font-semibold uppercase tracking-wide text-bone-100">
          {{ t('meta.vehicleTitle', { name: lt(item.name) }) }}
        </h1>
        <p v-if="lt(item.tagline)" class="mt-3 text-lg text-bone-400 leading-relaxed">
          {{ lt(item.tagline) }}
        </p>

        <div class="mt-8 flex flex-col sm:flex-row gap-3">
          <a href="#request-offer" class="btn-gold flex-1 text-center">
            {{ t('common.requestOffer') }}
          </a>
          <AddToCartButton type="equipment" :id="item.id" class="justify-center flex-1" />
        </div>
      </div>
    </div>

    <!-- Offer form -->
    <div id="request-offer" class="mt-16 scroll-mt-28">
      <div class="bg-ink-800 border border-ink-700 p-6 sm:p-8 lg:max-w-3xl">
        <h2 class="text-2xl font-semibold uppercase tracking-wide text-bone-100">
          {{ t('vehicle.requestTitle') }}
        </h2>
        <p class="mt-2 text-sm text-bone-400 leading-relaxed">
          {{ t('vehicle.requestIntro') }}
        </p>
        <div class="mt-7">
          <RequestOfferForm />
        </div>
      </div>
    </div>

    <!-- More in this category -->
    <section v-if="related.length" class="mt-20">
      <SectionHeading :kicker="t(`equipmentCategories.${item.category}`)" :title="t('vehicle.moreInCategory')" />
      <div class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <EquipmentCard v-for="e in related" :key="e.id" :item="e" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
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

const siteUrl = useRuntimeConfig().public.siteUrl
const absImage = (src: string) => (src.startsWith('http') ? src : `${siteUrl}${src}`)

// Make sure the rental phrase appears in the SERP snippet: when the tagline
// doesn't already say it, prefix "{name} til leigu." — Google bolds the query
// terms in descriptions, which lifts click-through.
const metaDescription = computed(() => {
  const tagline = lt(item.tagline)
  if (!tagline) return `${t('meta.vehicleTitle', { name: lt(item.name) })}. ${t('meta.equipment.description')}`
  return /til leigu|for rent/i.test(tagline)
    ? tagline
    : `${t('meta.vehicleTitle', { name: lt(item.name) })}. ${tagline}`
})

useSeoMeta({
  title: () => t('meta.vehicleTitle', { name: lt(item.name) }),
  description: () => metaDescription.value,
  ogTitle: () => `${t('meta.vehicleTitle', { name: lt(item.name) })} · Creative Filmmaking`,
  ogDescription: () => metaDescription.value,
  ogImage: item.images[0] ? absImage(item.images[0]) : undefined,
  ogImageAlt: item.images[0] ? () => lt(item.name) : undefined,
})

// No Product node on purpose: Google requires offers/reviews on Product
// markup for rich results, and prices here are offer-on-request — a Product
// node without them just generates "invalid item" noise in Search Console.
// Breadcrumb (a valid enhancement) carries the structure instead.
useSchemaOrg([
  defineBreadcrumb({
    itemListElement: [
      { name: t('nav.home'), item: localePath('/') },
      { name: t('nav.equipment'), item: localePath('/equipment') },
      { name: lt(item.name), item: localePath(`/equipment/${equipmentSlug(item)}`) },
    ],
  }),
])
</script>
