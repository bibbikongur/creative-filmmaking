<template>
  <div>
    <div class="wrap section">
      <SectionHeading as="h1" :kicker="t('about.kicker')" :title="t('about.title')" />

      <div class="mt-10 max-w-3xl space-y-5 text-bone-400 leading-relaxed">
        <p>{{ t('about.p1') }}</p>
        <p>{{ t('about.p2') }}</p>
        <!-- SEO prose: names what's for rent, where we are and who can rent. -->
        <p>{{ t('about.rentals') }}</p>
        <p>{{ t('about.private') }}</p>
        <p>{{ t('about.p3') }}</p>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-ink-800">
          <div>
            <p class="text-3xl font-heading font-semibold text-gold-500 tabular-nums">{{ fleetCount }}+</p>
            <p class="mt-1 meta text-bone-400">{{ t('about.statVehicles') }}</p>
          </div>
          <div>
            <p class="text-3xl font-heading font-semibold text-gold-500 tabular-nums">24/7</p>
            <p class="mt-1 meta text-bone-400">{{ t('about.statSupport') }}</p>
          </div>
          <div>
            <p class="text-3xl font-heading font-semibold text-gold-500 tabular-nums">100%</p>
            <p class="mt-1 meta text-bone-400">{{ t('about.statArea') }}</p>
          </div>
        </div>
      </div>
    </div>

    <CtaBanner />
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { all } = await useVehicles()

// Counted from the live catalogue so the number never goes stale.
const fleetCount = computed(() => all().reduce((n, v) => n + (v.specs.units ?? 1), 0))

useSeoMeta({
  title: t('meta.about.title'),
  description: t('meta.about.description'),
  ogTitle: `${t('meta.about.title')} · Creative Filmmaking`,
  ogDescription: t('meta.about.description'),
})

useSchemaOrg([
  defineWebPage({ '@type': 'AboutPage' }),
])
</script>
