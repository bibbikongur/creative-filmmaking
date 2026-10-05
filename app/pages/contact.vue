<template>
  <div class="wrap section">
    <SectionHeading as="h1" :kicker="t('contact.kicker')" :title="t('contact.title')" :intro="t('contact.intro')" />

    <div class="mt-12 grid gap-10 lg:grid-cols-5">
      <!-- Form -->
      <div class="lg:col-span-3 panel">
        <h2 class="h3">{{ t('vehicle.requestTitle') }}</h2>
        <p class="mt-2 text-sm text-bone-400 leading-relaxed">{{ t('vehicle.requestIntro') }}</p>
        <div class="mt-7">
          <QuoteForm :vehicle="prefill" show-vehicle-select message-required />
        </div>
      </div>

      <!-- Direct contact -->
      <div class="lg:col-span-2">
        <div class="panel-muted">
          <h2 class="h3">
            {{ t('contact.directTitle') }}
          </h2>
          <dl class="mt-6 space-y-5 text-sm">
            <div>
              <dt class="label">{{ t('contact.emailLabel') }}</dt>
              <dd>
                <a :href="`mailto:${contact.email}`" class="text-bone-100 hover:text-gold-400 transition-colors">
                  {{ contact.email }}
                </a>
              </dd>
            </div>
            <div>
              <dt class="label">{{ t('contact.phoneLabel') }}</dt>
              <dd>
                <a :href="`tel:${contact.phone.replace(/\s/g, '')}`" class="text-bone-100 hover:text-gold-400 transition-colors">
                  {{ contact.phone }}
                </a>
              </dd>
            </div>
            <div>
              <dt class="label">{{ t('contact.addressLabel') }}</dt>
              <dd class="text-bone-100">{{ contact.address }}</dd>
            </div>
          </dl>
          <p class="mt-8 pt-6 border-t border-ink-800 text-xs text-bone-400 leading-relaxed flex items-start gap-2.5">
            <span class="w-1.5 h-1.5 mt-1 rounded-full bg-signal-500 motion-safe:animate-pulse shrink-0" aria-hidden="true" />
            {{ t('contact.responseNote') }}
          </p>
        </div>

        <!-- Map: OpenStreetMap embed, no script, no cookies -->
        <div class="mt-4 border border-ink-800 bg-ink-900 overflow-hidden">
          <iframe
            :title="t('contact.mapTitle')"
            :src="mapSrc"
            class="block w-full aspect-card grayscale contrast-125 opacity-90"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
          />
        </div>
        <a
          :href="mapsUrl"
          target="_blank"
          rel="noopener"
          class="mt-3 inline-flex items-center gap-2 text-sm text-bone-400 hover:text-gold-400 transition-colors"
        >
          {{ t('contact.openMap') }}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>

    <FaqSection class="mt-20" :kicker="t('faq.kicker')" :title="t('faq.title')" :items="faqItems" />
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const contact = useRuntimeConfig().public.contact
const { faq } = useFaq()
const faqItems = faq('faq.contact')

// Deep-link support: /contact?vehicle=<slug> preselects the vehicle.
const prefill = typeof route.query.vehicle === 'string' ? route.query.vehicle : undefined

const { lat, lng } = contact
const d = 0.0045
const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d * 2},${lat - d},${lng + d * 2},${lat + d}&layer=mapnik&marker=${lat},${lng}`
const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`

useSeoMeta({
  title: t('meta.contact.title'),
  description: t('meta.contact.description'),
  ogTitle: `${t('meta.contact.title')} · Creative Filmmaking`,
  ogDescription: t('meta.contact.description'),
})

useSchemaOrg([
  defineWebPage({ '@type': faqItems.length ? ['ContactPage', 'FAQPage'] : 'ContactPage' }),
])
</script>
