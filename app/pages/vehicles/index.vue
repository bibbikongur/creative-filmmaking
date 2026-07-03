<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
    <SectionHeading :kicker="t('catalogue.kicker')" :title="t('catalogue.title')" />
    <p class="mt-5 max-w-2xl text-bone-400 leading-relaxed">
      {{ t('catalogue.intro') }}
    </p>

    <div class="mt-10">
      <CategoryFilter v-model="activeCategory" />
    </div>

    <div v-if="filtered.length" class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <VehicleCard v-for="v in filtered" :key="v.id" :vehicle="v" />
    </div>
    <div v-else class="mt-16 text-center">
      <p class="text-bone-400">{{ t('catalogue.empty') }}</p>
      <NuxtLink :to="localePath('/contact')" class="btn-gold mt-6">
        {{ t('common.requestOffer') }}
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { VehicleCategory } from '~/types'
import { categories } from '~/data/categories'

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const router = useRouter()
const { all } = useVehicles()

const isCategory = (v: unknown): v is VehicleCategory =>
  typeof v === 'string' && categories.some(c => c.id === v)

// The ?category= query param is the single source of truth — URLs are
// shareable and the browser back button walks the filter history.
const activeCategory = computed<VehicleCategory | null>({
  get: () => (isCategory(route.query.category) ? route.query.category : null),
  set: (value) => {
    router.push({ query: value ? { category: value } : {} })
  },
})

const filtered = computed(() =>
  activeCategory.value ? all().filter(v => v.category === activeCategory.value) : all(),
)

useSeoMeta({
  title: t('meta.vehicles.title'),
  description: t('meta.vehicles.description'),
  ogTitle: `${t('meta.vehicles.title')} · Creative Filmmaking`,
  ogDescription: t('meta.vehicles.description'),
})

useSchemaOrg([
  defineItemList({
    itemListElement: all().map(v => ({
      url: localePath(`/vehicles/${v.slug}`),
    })),
  }),
])
</script>
