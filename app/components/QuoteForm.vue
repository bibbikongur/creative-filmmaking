<template>
  <!-- One form for every entry point: contact page (vehicle select), vehicle and
       equipment detail pages (item name passed as `interest`) and the cart
       (endpoint /api/quotes with the list in extraBody). -->
  <div v-if="sent" ref="successEl" tabindex="-1" class="py-4 text-center focus:outline-none" role="status">
    <svg class="w-10 h-10 mx-auto text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <h3 class="h3 mt-4">
      {{ t('form.successTitle') }}
    </h3>
    <p class="mt-2 text-sm text-bone-400">{{ t('form.successText') }}</p>
  </div>

  <form v-else class="space-y-5" novalidate @submit.prevent="submit">
    <div class="grid gap-5 sm:grid-cols-2">
      <div>
        <label :for="`${uid}-name`" class="label">
          {{ t('form.name') }} <span class="text-gold-500" aria-hidden="true">*</span>
        </label>
        <input
          :id="`${uid}-name`"
          v-model.trim="form.name"
          type="text"
          name="name"
          autocomplete="name"
          required
          class="input-dark"
          :class="fieldError('name') ? 'border-signal-500' : ''"
          :aria-invalid="fieldError('name') ? 'true' : undefined"
          :aria-describedby="fieldError('name') ? `${uid}-name-error` : undefined"
        >
        <p v-if="fieldError('name')" :id="`${uid}-name-error`" class="mt-1 text-xs text-signal-400">{{ fieldError('name') }}</p>
      </div>
      <div>
        <label :for="`${uid}-email`" class="label">
          {{ t('form.email') }} <span class="text-gold-500" aria-hidden="true">*</span>
        </label>
        <input
          :id="`${uid}-email`"
          v-model.trim="form.email"
          type="email"
          name="email"
          autocomplete="email"
          required
          class="input-dark"
          :class="fieldError('email') ? 'border-signal-500' : ''"
          :aria-invalid="fieldError('email') ? 'true' : undefined"
          :aria-describedby="fieldError('email') ? `${uid}-email-error` : undefined"
        >
        <p v-if="fieldError('email')" :id="`${uid}-email-error`" class="mt-1 text-xs text-signal-400">{{ fieldError('email') }}</p>
      </div>
      <div>
        <label :for="`${uid}-phone`" class="label">
          {{ t('form.phone') }}
        </label>
        <input :id="`${uid}-phone`" v-model.trim="form.phone" type="tel" name="phone" autocomplete="tel" class="input-dark">
      </div>
      <div>
        <label :for="`${uid}-company`" class="label">
          {{ t('form.company') }}
        </label>
        <input :id="`${uid}-company`" v-model.trim="form.company" type="text" name="company" autocomplete="organization" class="input-dark">
      </div>
      <div :class="showVehicleSelect ? '' : 'sm:col-span-2'">
        <label :for="`${uid}-dates`" class="label">
          {{ t('form.dates') }}
        </label>
        <input :id="`${uid}-dates`" v-model.trim="form.dates" type="text" name="dates" :placeholder="t('form.datesPlaceholder')" class="input-dark">
      </div>
      <div v-if="showVehicleSelect">
        <label :for="`${uid}-vehicle`" class="label">
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
      <label :for="`${uid}-message`" class="label">
        {{ t('form.message') }} <span v-if="messageRequired" class="text-gold-500" aria-hidden="true">*</span>
      </label>
      <textarea
        :id="`${uid}-message`"
        v-model.trim="form.message"
        name="message"
        rows="5"
        :placeholder="t('form.messagePlaceholder')"
        :required="messageRequired"
        class="input-dark resize-y"
        :class="fieldError('message') ? 'border-signal-500' : ''"
        :aria-invalid="fieldError('message') ? 'true' : undefined"
        :aria-describedby="fieldError('message') ? `${uid}-message-error` : undefined"
      />
      <p v-if="fieldError('message')" :id="`${uid}-message-error`" class="mt-1 text-xs text-signal-400">{{ fieldError('message') }}</p>
    </div>

    <HoneypotField v-model="form.website" />

    <div v-if="failed" class="border border-signal-500/50 bg-signal-500/10 p-4 text-sm" role="alert">
      <p class="font-semibold text-signal-400">{{ t('form.errorTitle') }}</p>
      <i18n-t keypath="form.errorText" tag="p" class="mt-1 text-bone-400">
        <template #email>
          <a :href="`mailto:${contact.email}`" class="text-gold-400 underline">{{ contact.email }}</a>
        </template>
      </i18n-t>
    </div>

    <button type="submit" class="btn-gold w-full sm:w-auto" :disabled="pending">
      {{ pending ? t('form.sending') : (submitLabel || t('form.submit')) }}
    </button>
  </form>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  /** /api/contact sends an email; /api/quotes stores the cart list as a quote request */
  endpoint?: '/api/contact' | '/api/quotes'
  submitLabel?: string
  messageRequired?: boolean
  /** Show the "vehicle of interest" dropdown (contact page) */
  showVehicleSelect?: boolean
  /** Slug of the vehicle to preselect in the dropdown (from ?vehicle=) */
  vehicle?: string
  /** Display name of the item the visitor is looking at; sent as the free-text
   *  "vehicle" field so it lands in the email subject (detail pages) */
  interest?: string
  /** Extra fields merged into the request body (cart: locale + items) */
  extraBody?: Record<string, unknown>
}>(), {
  endpoint: '/api/contact',
  submitLabel: '',
  messageRequired: false,
  showVehicleSelect: false,
  vehicle: undefined,
  interest: undefined,
  extraBody: undefined,
})

const emit = defineEmits<{ sent: [] }>()

const { t } = useI18n()
const { lt } = useLocalized()
const contact = useRuntimeConfig().public.contact
const allVehicles = (await useVehicles()).all()
const uid = useId()
const successEl = ref<HTMLElement | null>(null)

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
  errors.message = props.messageRequired && !form.message ? t('form.required') : ''
  errors.email = !form.email
    ? t('form.required')
    : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? '' : t('form.invalidEmail')
  return !errors.name && !errors.email && !errors.message
}

const fieldError = (field: string) => (touchedSubmit.value ? errors[field] : '')

const submit = async () => {
  touchedSubmit.value = true
  failed.value = false
  if (!validate()) {
    // Move focus to the first invalid field so keyboard and screen-reader users hear the error
    await nextTick()
    const first = (['name', 'email', 'message'] as const).find(f => errors[f])
    if (first) document.getElementById(`${uid}-${first}`)?.focus()
    return
  }

  const body: Record<string, unknown> = { ...form, ...(props.extraBody ?? {}) }
  if (props.endpoint === '/api/contact') {
    // Send a display name, not a slug — it lands in the email subject
    body.vehicle = props.interest
      ?? (form.vehicle ? lt(allVehicles.find(v => v.slug === form.vehicle)?.name) : '')
  }
  else {
    delete body.vehicle
  }

  pending.value = true
  try {
    await $fetch(props.endpoint, { method: 'POST', body })
    sent.value = true
    emit('sent')
    await nextTick()
    successEl.value?.focus()
  }
  catch {
    failed.value = true
  }
  finally {
    pending.value = false
  }
}
</script>
