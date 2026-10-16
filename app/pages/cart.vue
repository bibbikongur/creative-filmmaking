<template>
  <div class="wrap section-sm">
    <div class="max-w-5xl mx-auto">
      <SectionHeading as="h1" :kicker="t('cart.kicker')" :title="t('cart.title')" />

      <!-- Success state replaces the whole page body -->
      <div v-if="sent" class="mt-10 panel text-center" role="status">
        <svg class="w-10 h-10 mx-auto text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 class="h3 mt-4">
          {{ t('cart.successTitle') }}
        </h2>
        <p class="mt-2 text-sm text-bone-400">{{ t('cart.successText') }}</p>
        <NuxtLink :to="localePath('/vehicles')" class="btn-gold mt-8">
          {{ t('common.viewFleet') }}
        </NuxtLink>
      </div>

      <!-- Empty state -->
      <div v-else-if="!items.length" class="mt-10 panel text-center">
        <p class="text-bone-400">{{ t('cart.empty') }}</p>
        <NuxtLink :to="localePath('/vehicles')" class="btn-gold mt-6">
          {{ t('cart.emptyCta') }}
        </NuxtLink>
      </div>

      <template v-else>
        <!-- Items -->
        <ul class="mt-10 divide-y divide-ink-700 border border-ink-700 bg-ink-800">
          <li v-for="item in items" :key="`${item.entry.type}-${item.entry.id}`" class="flex items-center gap-4 p-4">
            <NuxtLink :to="localePath(item.link)" class="shrink-0 w-24 h-16 overflow-hidden" :class="item.entry.type === 'equipment' ? 'bg-product-well' : 'bg-ink-900'">
              <NuxtImg
                v-if="item.image"
                :src="item.image"
                :provider="imgProvider(item.image)"
                :alt="item.name"
                class="w-full h-full"
                :class="item.entry.type === 'equipment' ? 'object-contain p-1' : 'object-cover'"
                width="96"
                height="64"
                loading="lazy"
              />
              <ImagePlaceholder v-else icon-class="w-5 h-5" />
            </NuxtLink>
            <div class="flex-1 min-w-0">
              <NuxtLink
                :to="localePath(item.link)"
                class="block font-heading font-semibold uppercase tracking-wide text-bone-100 truncate hover:text-gold-400 transition-colors"
              >
                {{ item.name }}
              </NuxtLink>
              <p class="text-xs text-bone-400 mt-0.5 truncate">{{ item.tagline }}</p>
            </div>
            <AddToCartButton v-if="item.entry.type === 'equipment'" type="equipment" :id="item.entry.id" compact />
            <button
              type="button"
              class="p-2 text-bone-400 hover:text-signal-400 transition-colors"
              :aria-label="`${t('cart.remove')}: ${item.name}`"
              @click="cart.remove(item.entry.type, item.entry.id)"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </li>
        </ul>

        <!-- Quote request form -->
        <div class="mt-12 panel">
          <h2 class="h3">
            {{ t('cart.formTitle') }}
          </h2>
          <p class="mt-2 text-sm text-bone-400 leading-relaxed">
            {{ t('cart.formIntro') }}
          </p>
          <div class="mt-7">
            <QuoteForm
              endpoint="/api/quotes"
              :extra-body="extraBody"
              :submit-label="t('cart.submit')"
              @sent="onSent"
            />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t, locale } = useI18n()
const { lt } = useLocalized()
const localePath = useLocalePath()
const cart = useCart()

const { all: allVehicles } = await useVehicles()
const { all: allEquipment } = await useEquipment()

// Resolve cart entries against the catalogue; unknown ids (item deleted in
// admin since it was added) are dropped from the cookie on mount.
const items = computed(() => cart.entries.value.flatMap((entry) => {
  if (entry.type === 'vehicle') {
    const v = allVehicles().find(x => x.id === entry.id)
    return v ? [{ entry, name: lt(v.name), tagline: lt(v.tagline), image: v.images[0], link: `/vehicles/${v.slug}` }] : []
  }
  const e = allEquipment().find(x => x.id === entry.id)
  return e ? [{ entry, name: lt(e.name), tagline: lt(e.tagline), image: e.images[0], link: `/equipment/${equipmentSlug(e)}` }] : []
}))

onMounted(() => {
  cart.prune({
    vehicle: new Set(allVehicles().map(v => v.id)),
    equipment: new Set(allEquipment().map(e => e.id)),
  })
})

const extraBody = computed(() => ({ locale: locale.value, items: cart.entries.value }))

const sent = ref(false)
const onSent = () => {
  sent.value = true
  cart.clear()
}

useSeoMeta({
  title: () => t('cart.title'),
  robots: 'noindex',
})
</script>
