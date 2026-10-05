<template>
  <div>
    <div class="wrap section">
      <SectionHeading as="h1" :kicker="t('about.kicker')" :title="t('about.title')" />

      <!-- Fleet photos until dedicated team/location stills exist -->
      <div v-if="photos.length" class="mt-10 grid grid-cols-2 gap-3 sm:gap-4">
        <div v-for="p in photos" :key="p.src" class="relative overflow-hidden aspect-card bg-ink-800">
          <NuxtImg
            :src="p.src"
            :provider="imgProvider(p.src)"
            :alt="p.alt"
            class="w-full h-full object-cover"
            sizes="xs:50vw lg:640px"
            loading="lazy"
          />
        </div>
      </div>

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
const { lt } = useLocalized()
const { all, featured } = await useVehicles()

// Two fleet stills: featured vehicles first, then anything with a photo.
const photos = computed(() => {
  const pool = [...featured(), ...all()]
  const seen = new Set<string>()
  const out: { src: string, alt: string }[] = []
  for (const v of pool) {
    const src = v.images[0]
    if (!src || seen.has(src)) continue
    seen.add(src)
    out.push({ src, alt: lt(v.name) })
    if (out.length === 2) break
  }
  return out
})

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
