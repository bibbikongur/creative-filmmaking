<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
    <SectionHeading :kicker="t('contact.kicker')" :title="t('contact.title')" />
    <p class="mt-5 max-w-2xl text-bone-400 leading-relaxed">
      {{ t('contact.intro') }}
    </p>

    <div class="mt-12 grid gap-10 lg:grid-cols-5">
      <!-- Form -->
      <div class="lg:col-span-3 bg-ink-800 border border-ink-700 p-6 sm:p-8">
        <RequestOfferForm :vehicle="prefill" />
      </div>

      <!-- Direct contact -->
      <div class="lg:col-span-2">
        <div class="bg-ink-900 border border-ink-800 p-6 sm:p-8">
          <h2 class="text-xl font-semibold uppercase tracking-wide text-bone-100">
            {{ t('contact.directTitle') }}
          </h2>
          <dl class="mt-6 space-y-5 text-sm">
            <div>
              <dt class="kicker !text-[10px]">{{ t('contact.emailLabel') }}</dt>
              <dd class="mt-1.5">
                <a :href="`mailto:${contact.email}`" class="text-bone-100 hover:text-gold-400 transition-colors">
                  {{ contact.email }}
                </a>
              </dd>
            </div>
            <div>
              <dt class="kicker !text-[10px]">{{ t('contact.phoneLabel') }}</dt>
              <dd class="mt-1.5">
                <a :href="`tel:${contact.phone.replace(/\s/g, '')}`" class="text-bone-100 hover:text-gold-400 transition-colors">
                  {{ contact.phone }}
                </a>
              </dd>
            </div>
            <div>
              <dt class="kicker !text-[10px]">{{ t('contact.addressLabel') }}</dt>
              <dd class="mt-1.5 text-bone-100">{{ contact.address }}</dd>
            </div>
          </dl>
          <p class="mt-8 pt-6 border-t border-ink-800 text-xs text-bone-400 leading-relaxed flex items-start gap-2.5">
            <span class="w-1.5 h-1.5 mt-1 rounded-full bg-signal-500 animate-pulse shrink-0" aria-hidden="true" />
            {{ t('contact.responseNote') }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const contact = useRuntimeConfig().public.contact

// Deep-link support: /contact?vehicle=<slug> preselects the vehicle.
const prefill = typeof route.query.vehicle === 'string' ? route.query.vehicle : undefined

useSeoMeta({
  title: t('meta.contact.title'),
  description: t('meta.contact.description'),
  ogTitle: `${t('meta.contact.title')} · Creative Filmmaking`,
  ogDescription: t('meta.contact.description'),
})
</script>
