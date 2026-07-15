<template>
  <div>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
      <SectionHeading :kicker="t('about.kicker')" :title="t('about.title')" />

      <!-- Photos removed for now — real ones will be added here later. -->
      <div class="mt-10 max-w-3xl space-y-5 text-bone-400 leading-relaxed">
        <p>{{ t('about.p1') }}</p>
        <p>{{ t('about.p2') }}</p>
        <p>{{ t('about.p3') }}</p>

        <div class="grid grid-cols-3 gap-6 pt-6 border-t border-ink-800">
          <div>
            <p class="text-3xl font-heading font-semibold text-gold-500">9+</p>
            <p class="mt-1 text-xs uppercase tracking-widest text-bone-400">{{ t('about.statVehicles') }}</p>
          </div>
          <div>
            <p class="text-3xl font-heading font-semibold text-gold-500">24/7</p>
            <p class="mt-1 text-xs uppercase tracking-widest text-bone-400">{{ t('about.statSupport') }}</p>
          </div>
          <div>
            <p class="text-3xl font-heading font-semibold text-gold-500">100%</p>
            <p class="mt-1 text-xs uppercase tracking-widest text-bone-400">{{ t('about.statArea') }}</p>
          </div>
        </div>
      </div>
    </div>

    <CtaBanner />
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

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
