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
        <CategoryLinks :items="chips" :group-label="t('equipmentCatalogue.kicker')" />
      </div>

      <div v-if="items.length" class="mt-10 card-grid">
        <EquipmentCard v-for="e in items" :key="e.id" :item="e" />
      </div>
      <div v-else class="mt-16 text-center">
        <p class="text-bone-400">{{ t('equipmentCatalogue.empty') }}</p>
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
import type { EquipmentLanding } from '~/data/equipmentLandings'
import { equipmentLandings } from '~/data/equipmentLandings'

// Shared body of every /equipment/<category> keyword page; see
// VehicleLandingPage for the pattern.
const props = defineProps<{ landing: EquipmentLanding }>()

const { t, te } = useI18n()
const localePath = useLocalePath()
const { all, byCategory } = await useEquipment()
const { faq } = useFaq()

const k = props.landing.key
const items = computed(() => byCategory(props.landing.category))

const intro = computed(() =>
  [1, 2, 3].map(i => `${k}.intro${i}`).filter(key => te(key)).map(key => t(key)),
)

const faqItems = computed(() => faq(`${k}.faq`))

const chips = computed(() => {
  const present = new Set(all().map(e => e.category))
  return [
    { label: t('equipmentCatalogue.all'), to: localePath('/equipment'), active: false },
    ...equipmentLandings
      .filter(l => l.category === props.landing.category || present.has(l.category))
      .map(l => ({
        label: t(`${l.key}.title`),
        to: localePath({ name: l.routeName }),
        active: l.category === props.landing.category,
      })),
  ]
})

const crumbs = computed(() => [
  { label: t('nav.home'), to: localePath('/') },
  { label: t('nav.equipment'), to: localePath('/equipment') },
  { label: t(`${k}.title`), to: localePath({ name: props.landing.routeName }) },
])

useSeoMeta({
  title: () => t(`${k}.metaTitle`),
  description: () => t(`${k}.metaDescription`),
  ogTitle: () => `${t(`${k}.metaTitle`)} · Creative Filmmaking`,
  ogDescription: () => t(`${k}.metaDescription`),
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
