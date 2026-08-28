<template>
  <div>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
      <SectionHeading as="h1" :kicker="t('equipmentCatalogue.kicker')" :title="t('equipmentCatalogue.title')" />
      <p class="mt-5 max-w-2xl text-bone-400 leading-relaxed">
        {{ t('equipmentCatalogue.intro') }}
      </p>

      <div class="mt-10">
        <EquipmentCategoryFilter v-model="activeCategory" :available="presentCategories" />
      </div>

      <div v-if="filtered.length" class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <EquipmentCard v-for="e in filtered" :key="e.id" :item="e" />
      </div>
      <div v-else class="mt-16 text-center">
        <p class="text-bone-400">{{ t('equipmentCatalogue.empty') }}</p>
        <NuxtLink :to="localePath('/contact')" class="btn-gold mt-6">
          {{ t('common.requestOffer') }}
        </NuxtLink>
      </div>

      <!-- SEO prose: spells out in plain words what's for rent, so search
           engines (and skimming humans) get the full picture the card grid
           alone doesn't convey. -->
      <section class="mt-20 max-w-3xl">
        <h2 class="text-2xl font-semibold uppercase tracking-wide text-bone-100">
          {{ t('equipmentCatalogue.seoTitle') }}
        </h2>
        <p class="mt-4 text-sm text-bone-400 leading-relaxed">
          {{ t('equipmentCatalogue.seoText') }}
        </p>
        <p class="mt-3 text-sm text-bone-400 leading-relaxed">
          {{ t('equipmentCatalogue.seoText2') }}
        </p>
      </section>
    </div>

    <CtaBanner />
  </div>
</template>

<script setup lang="ts">
import type { EquipmentCategory } from '~/types'
import { equipmentCategories } from '~/data/equipmentCategories'

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const router = useRouter()
const { all } = await useEquipment()

const isCategory = (v: unknown): v is EquipmentCategory =>
  typeof v === 'string' && equipmentCategories.includes(v as EquipmentCategory)

// The ?category= query param is the single source of truth — URLs are
// shareable and the browser back button walks the filter history.
const activeCategory = computed<EquipmentCategory | null>({
  get: () => (isCategory(route.query.category) ? route.query.category : null),
  set: (value) => {
    router.push({ query: value ? { category: value } : {} })
  },
})

const filtered = computed(() =>
  activeCategory.value ? all().filter(e => e.category === activeCategory.value) : all(),
)

const presentCategories = computed(() => [...new Set(all().map(e => e.category))])

useSeoMeta({
  title: t('meta.equipment.title'),
  description: t('meta.equipment.description'),
  ogTitle: `${t('meta.equipment.title')} · Creative Filmmaking`,
  ogDescription: t('meta.equipment.description'),
})

// Every rental item as a named Product linking to its detail page.
const { lt } = useLocalized()
const siteUrl = useRuntimeConfig().public.siteUrl
useSchemaOrg([
  defineItemList({
    itemListElement: all().map(e => ({
      '@type': 'Product',
      name: lt(e.name),
      url: `${siteUrl}${localePath(`/equipment/${equipmentSlug(e)}`)}`,
      ...(e.images[0]
        ? { image: e.images[0].startsWith('http') ? e.images[0] : `${siteUrl}${e.images[0]}` }
        : {}),
    })),
  }),
])
</script>
