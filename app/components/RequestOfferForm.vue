<template>
  <!-- Success state replaces the form entirely -->
  <div v-if="sent" class="bg-ink-800 border border-ink-700 p-8 text-center">
    <svg class="w-10 h-10 mx-auto text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <h3 class="mt-4 text-xl font-semibold uppercase tracking-wide text-bone-100">
      {{ t('form.successTitle') }}
    </h3>
    <p class="mt-2 text-sm text-bone-400">{{ t('form.successText') }}</p>
  </div>

  <form v-else class="space-y-5" novalidate @submit.prevent="submit">
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
      <div>
        <label :for="`${uid}-dates`" class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">
          {{ t('form.dates') }}
        </label>
        <input :id="`${uid}-dates`" v-model.trim="form.dates" type="text" name="dates" :placeholder="t('form.datesPlaceholder')" class="input-dark">
      </div>
      <div>
        <label :for="`${uid}-vehicle`" class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">
          {{ t('form.vehicle') }}
        </label>
        <select :id="`${uid}-vehicle`" v-model="form.vehicle" name="vehicle" class="input-dark">
          <option value="">{{ t('form.generalInquiry') }}</option>
          <option v-for="v in allVehicles" :key="v.slug" :value="v.slug">
            {{ lt(v.name) }}
          </option>
        </select>
      </div>
    </div>

    <div>
      <label :for="`${uid}-message`" class="block text-xs uppercase tracking-widest text-bone-400 mb-1.5">
        {{ t('form.message') }} <span class="text-gold-500">*</span>
      </label>
      <textarea :id="`${uid}-message`" v-model.trim="form.message" name="message" rows="5" :placeholder="t('form.messagePlaceholder')" class="input-dark resize-y" :class="fieldError('message') ? 'border-signal-500' : ''" />
      <p v-if="fieldError('message')" class="mt-1 text-xs text-signal-500">{{ fieldError('message') }}</p>
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
      {{ pending ? t('form.sending') : t('form.submit') }}
    </button>
  </form>
</template>

<script setup lang="ts">
const props = defineProps<{
  /** Slug of the vehicle to preselect (from detail page or ?vehicle= query) */
  vehicle?: string
}>()

const { t } = useI18n()
const { lt } = useLocalized()
const contact = useRuntimeConfig().public.contact
const allVehicles = (await useVehicles()).all()
const uid = useId()

const form = reactive({
  name: '',
  email: '',
  phone: '',
  company: '',
  dates: '',
  vehicle: props.vehicle && allVehicles.some(v => v.slug === props.vehicle) ? props.vehicle : '',
  message: '',
  website: '',
})

const pending = ref(false)
const sent = ref(false)
const failed = ref(false)
const errors = reactive<Record<string, string>>({})
const touchedSubmit = ref(false)

const validate = () => {
  errors.name = form.name ? '' : t('form.required')
  errors.message = form.message ? '' : t('form.required')
  errors.email = !form.email
    ? t('form.required')
    : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? '' : t('form.invalidEmail')
  return !errors.name && !errors.email && !errors.message
}

const fieldError = (field: string) => (touchedSubmit.value ? errors[field] : '')

const submit = async () => {
  touchedSubmit.value = true
  failed.value = false
  if (!validate()) return

  pending.value = true
  try {
    await $fetch('/api/contact', {
      method: 'POST',
      body: {
        ...form,
        // Send the display name, not the slug — this lands in the email subject
        vehicle: form.vehicle ? lt(allVehicles.find(v => v.slug === form.vehicle)?.name) : '',
      },
    })
    sent.value = true
  }
  catch {
    failed.value = true
  }
  finally {
    pending.value = false
  }
}
</script>
