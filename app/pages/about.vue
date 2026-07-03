<template>
  <div>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
      <SectionHeading :kicker="t('about.kicker')" :title="t('about.title')" />

      <div class="mt-10 grid gap-12 lg:grid-cols-2 lg:items-start">
        <div class="space-y-5 text-bone-400 leading-relaxed">
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

        <div class="grid gap-4">
          <NuxtImg
            src="https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1600&q=80"
            :alt="t('about.title')"
            class="w-full aspect-cinema object-cover"
            sizes="sm:100vw lg:50vw"
            loading="lazy"
          />
          <NuxtImg
            src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80"
            alt=""
            class="w-full aspect-cinema object-cover"
            sizes="sm:100vw lg:50vw"
            loading="lazy"
          />
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
</script>
