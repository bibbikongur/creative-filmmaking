<template>
  <div>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
      <SectionHeading :kicker="t('equipmentCatalogue.kicker')" :title="t('equipmentCatalogue.title')" />
      <p class="mt-5 max-w-2xl text-bone-400 leading-relaxed">
        {{ t('equipmentCatalogue.intro') }}
      </p>

      <div class="mt-10">
        <EquipmentCategoryFilter v-model="activeCategory" />
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

useSeoMeta({
  title: t('meta.equipment.title'),
  description: t('meta.equipment.description'),
  ogTitle: `${t('meta.equipment.title')} · Creative Filmmaking`,
  ogDescription: t('meta.equipment.description'),
})
</script>
