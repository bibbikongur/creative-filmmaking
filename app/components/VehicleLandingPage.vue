<template>
  <div>
    <div class="wrap section-sm">
      <Breadcrumbs :items="crumbs" />

      <div class="mt-8">
        <SectionHeading as="h1" :kicker="t(`${k}.kicker`)" :title="t(`${k}.title`)" />
      </div>
      <div class="mt-6 max-w-3xl space-y-4 text-bone-400 leading-relaxed">
        <p v-for="(paragraph, i) in intro" :key="i">{{ paragraph }}</p>
      </div>

      <div class="mt-10">
        <CategoryLinks :items="chips" :group-label="t('catalogue.kicker')" />
      </div>

      <div v-if="vehicles.length" class="mt-10 card-grid">
        <VehicleCard v-for="v in vehicles" :key="v.id" :vehicle="v" />
      </div>
      <div v-else class="mt-16 text-center">
        <p class="text-bone-400">{{ t('catalogue.empty') }}</p>
        <NuxtLink :to="localePath('/contact')" class="btn-gold mt-6">
          {{ t('common.requestOffer') }}
        </NuxtLink>
      </div>

      <FaqSection class="mt-20" :kicker="t('faq.kicker')" :title="t('faq.title')" :items="faqItems" />
    </div>

    <CtaBanner />
  </div>
</template>

<script setup lang="ts">
import type { VehicleLanding } from '~/data/vehicleLandings'
import { vehicleLandings } from '~/data/vehicleLandings'

// Shared body of every /vehicles/<kind> keyword page. The page file only
// picks the landing and declares the English path; copy comes from the
// locale files under the landing's i18n key.
const props = defineProps<{ landing: VehicleLanding }>()

const { t, te } = useI18n()
const localePath = useLocalePath()
const { all, byKind } = await useVehicles()
const { faq } = useFaq()

const k = props.landing.key
const vehicles = computed(() => byKind(props.landing.kind))

const intro = computed(() =>
  [1, 2, 3].map(i => `${k}.intro${i}`).filter(key => te(key)).map(key => t(key)),
)

const faqItems = computed(() => faq(`${k}.faq`))

// Only landings that have vehicles are offered as pills; the current page
// always stays (it may be empty, in which case it is noindexed below).
const chips = computed(() => {
  const present = new Set(all().map(v => v.kind))
  return [
    { label: t('catalogue.all'), to: localePath('/vehicles'), active: false },
    ...vehicleLandings
      .filter(l => l.id === props.landing.id || present.has(l.kind))
      .map(l => ({
        label: t(`${l.key}.title`),
        to: localePath({ name: l.routeName }),
        active: l.id === props.landing.id,
      })),
  ]
})

const crumbs = computed(() => [
  { label: t('nav.home'), to: localePath('/') },
  { label: t('nav.fleet'), to: localePath('/vehicles') },
  { label: t(`${k}.title`), to: localePath({ name: props.landing.routeName }) },
])

useSeoMeta({
  title: () => t(`${k}.metaTitle`),
  description: () => t(`${k}.metaDescription`),
  ogTitle: () => `${t(`${k}.metaTitle`)} · Creative Filmmaking`,
  ogDescription: () => t(`${k}.metaDescription`),
  // An empty category is a thin page; keep it out of the index until it has stock.
  robots: () => (vehicles.value.length ? undefined : 'noindex, follow'),
})

const siteUrl = useRuntimeConfig().public.siteUrl
useSchemaOrg([
  defineWebPage({ '@type': faqItems.value.length ? ['CollectionPage', 'FAQPage'] : 'CollectionPage' }),
  defineItemList({
    itemListElement: vehicles.value.map(v => ({
      url: `${siteUrl}${localePath(`/vehicles/${v.slug}`)}`,
    })),
  }),
])
</script>
