<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
    <SectionHeading :kicker="t('cart.kicker')" :title="t('cart.title')" />

    <!-- Success state replaces the whole page body -->
    <div v-if="sent" class="mt-10 bg-ink-800 border border-ink-700 p-10 text-center">
      <svg class="w-10 h-10 mx-auto text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h2 class="mt-4 text-xl font-semibold uppercase tracking-wide text-bone-100">
        {{ t('cart.successTitle') }}
      </h2>
      <p class="mt-2 text-sm text-bone-400">{{ t('cart.successText') }}</p>
      <NuxtLink :to="localePath('/vehicles')" class="btn-gold mt-8 inline-flex">
        {{ t('common.viewFleet') }}
      </NuxtLink>
    </div>

    <!-- Empty state -->
    <div v-else-if="!items.length" class="mt-10 bg-ink-800 border border-ink-700 p-10 text-center">
      <p class="text-bone-400">{{ t('cart.empty') }}</p>
      <NuxtLink :to="localePath('/vehicles')" class="btn-gold mt-6 inline-flex">
        {{ t('cart.emptyCta') }}
      </NuxtLink>
    </div>

    <template v-else>
      <!-- Items -->
      <ul class="mt-10 divide-y divide-ink-700 border border-ink-700 bg-ink-800">
        <li v-for="item in items" :key="`${item.entry.type}-${item.entry.id}`" class="flex items-center gap-4 p-4">
          <NuxtLink :to="item.link ? localePath(item.link) : ''" class="shrink-0" :class="item.link ? '' : 'pointer-events-none'">
            <NuxtImg
              :src="item.image"
              :provider="imgProvider(item.image)"
              :alt="item.name"
              class="w-24 h-16 object-cover bg-ink-900"
              width="96"
              height="64"
              loading="lazy"
            />
          </NuxtLink>
          <div class="flex-1 min-w-0">
            <NuxtLink
              :to="item.link ? localePath(item.link) : ''"
              class="block font-semibold uppercase tracking-wide text-bone-100 truncate"
              :class="item.link ? 'hover:text-gold-400 transition-colors' : 'pointer-events-none'"
            >
              {{ item.name }}
            </NuxtLink>
            <p class="text-xs text-bone-400 mt-0.5 truncate">{{ item.tagline }}</p>
          </div>
          <AddToCartButton v-if="item.entry.type === 'equipment'" type="equipment" :id="item.entry.id" compact />
          <button
            type="button"
            class="p-2 text-bone-400 hover:text-signal-500 transition-colors"
            :aria-label="t('cart.remove')"
            @click="cart.remove(item.entry.type, item.entry.id)"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </li>
      </ul>

      <!-- Quote request form -->
      <div class="mt-12 bg-ink-800 border border-ink-700 p-6 sm:p-8">
        <h2 class="text-2xl font-semibold uppercase tracking-wide text-bone-100">
          {{ t('cart.formTitle') }}
        </h2>
        <p class="mt-2 text-sm text-bone-400 leading-relaxed">
          {{ t('cart.formIntro') }}
        </p>

        <form class="mt-7 space-y-5" novalidate @submit.prevent="submit">
          <div class="grid gap-5 sm:grid-cols-2">
            <div>
              <label :for="`${uid}-name`" class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">
                {{ t('form.name') }} <span class="text-gold-500">*</span>
              </label>
              <input :id="`${uid}-name`" v-model.trim="form.name" type="text" name="name" autocomplete="name" class="input-dark" :class="fieldError('name') ? 'border-signal-500' : ''">
              <p v-if="fieldError('name')" class="mt-1 text-xs text-signal-500">{{ fieldError('name') }}</p>
            </div>
            <div>
              <label :for="`${uid}-email`" class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">
                {{ t('form.email') }} <span class="text-gold-500">*</span>
              </label>
              <input :id="`${uid}-email`" v-model.trim="form.email" type="email" name="email" autocomplete="email" class="input-dark" :class="fieldError('email') ? 'border-signal-500' : ''">
              <p v-if="fieldError('email')" class="mt-1 text-xs text-signal-500">{{ fieldError('email') }}</p>
            </div>
            <div>
              <label :for="`${uid}-phone`" class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">
                {{ t('form.phone') }}
              </label>
              <input :id="`${uid}-phone`" v-model.trim="form.phone" type="tel" name="phone" autocomplete="tel" class="input-dark">
            </div>
            <div>
              <label :for="`${uid}-company`" class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">
                {{ t('form.company') }}
              </label>
              <input :id="`${uid}-company`" v-model.trim="form.company" type="text" name="company" autocomplete="organization" class="input-dark">
            </div>
            <div class="sm:col-span-2">
              <label :for="`${uid}-dates`" class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">
                {{ t('form.dates') }}
              </label>
              <input :id="`${uid}-dates`" v-model.trim="form.dates" type="text" name="dates" :placeholder="t('form.datesPlaceholder')" class="input-dark">
            </div>
          </div>

          <div>
            <label :for="`${uid}-message`" class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">
              {{ t('form.message') }}
            </label>
            <textarea :id="`${uid}-message`" v-model.trim="form.message" name="message" rows="4" :placeholder="t('form.messagePlaceholder')" class="input-dark resize-y" />
          </div>

          <HoneypotField v-model="form.website" />

          <div v-if="failed" class="border border-signal-500/50 bg-signal-500/10 p-4 text-sm">
            <p class="font-semibold text-signal-500">{{ t('form.errorTitle') }}</p>
            <i18n-t keypath="form.errorText" tag="p" class="mt-1 text-bone-400">
              <template #email>
                <a :href="`mailto:${contact.email}`" class="text-gold-400 underline">{{ contact.email }}</a>
              </template>
            </i18n-t>
          </div>

          <button type="submit" class="btn-gold w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed" :disabled="pending">
            {{ pending ? t('form.sending') : t('cart.submit') }}
          </button>
        </form>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
const { t, locale } = useI18n()
const { lt } = useLocalized()
const localePath = useLocalePath()
const contact = useRuntimeConfig().public.contact
const cart = useCart()
const uid = useId()

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
  return e ? [{ entry, name: lt(e.name), tagline: lt(e.tagline), image: e.images[0], link: '' }] : []
}))

onMounted(() => {
  cart.prune({
    vehicle: new Set(allVehicles().map(v => v.id)),
    equipment: new Set(allEquipment().map(e => e.id)),
  })
})

const form = reactive({ name: '', email: '', phone: '', company: '', dates: '', message: '', website: '' })
const pending = ref(false)
const sent = ref(false)
const failed = ref(false)
const errors = reactive<Record<string, string>>({})
const touchedSubmit = ref(false)

const validate = () => {
  errors.name = form.name ? '' : t('form.required')
  errors.email = !form.email
    ? t('form.required')
    : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? '' : t('form.invalidEmail')
  return !errors.name && !errors.email
}

const fieldError = (field: string) => (touchedSubmit.value ? errors[field] : '')

const submit = async () => {
  touchedSubmit.value = true
  failed.value = false
  if (!validate()) return

  pending.value = true
  try {
    await $fetch('/api/quotes', {
      method: 'POST',
      body: { ...form, locale: locale.value, items: cart.entries.value },
    })
    sent.value = true
    cart.clear()
  }
  catch {
    failed.value = true
  }
  finally {
    pending.value = false
  }
}

useSeoMeta({
  title: () => t('cart.title'),
  robots: 'noindex',
})
</script>
