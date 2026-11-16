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
    <p class="mt-2 text-sm text-bone-100/85 [text-wrap:balance]">{{ t('form.successReply', { email: sentTo }) }}</p>
    <p class="mt-4 text-sm text-bone-400">
      {{ t('form.successUrgent') }}
      <a :href="`tel:${contact.phone.replace(/\s/g, '')}`" class="inline-block py-2 -my-2 font-medium text-bone-100 underline decoration-ink-500 underline-offset-4 hover:decoration-bone-100 transition-colors whitespace-nowrap">{{ contact.phone }}</a>
    </p>
    <button type="button" class="mt-5 inline-flex items-center min-h-[2.75rem] text-sm font-medium text-bone-100 underline decoration-ink-500 underline-offset-4 hover:decoration-bone-100 transition-colors" @click="again">
      {{ t('form.successAgain') }}
    </button>
  </div>

  <form v-else class="space-y-5" novalidate @submit.prevent="submit">
    <p v-if="legend" class="text-[13px] text-bone-400">{{ t('form.requiredNote') }}</p>
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
          class="input-dark border-ink-500"
          :class="fieldError('name') ? '!border-signal-500' : ''"
          :aria-invalid="fieldError('name') ? 'true' : undefined"
          :aria-describedby="fieldError('name') ? `${uid}-name-error` : undefined"
        >
        <p v-if="fieldError('name')" :id="`${uid}-name-error`" class="mt-1.5 flex items-center gap-1.5 text-[13px] text-signal-400">
          <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {{ fieldError('name') }}
        </p>
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
          class="input-dark border-ink-500"
          :class="fieldError('email') ? '!border-signal-500' : ''"
          :aria-invalid="fieldError('email') ? 'true' : undefined"
          :aria-describedby="fieldError('email') ? `${uid}-email-error` : undefined"
        >
        <p v-if="fieldError('email')" :id="`${uid}-email-error`" class="mt-1.5 flex items-center gap-1.5 text-[13px] text-signal-400">
          <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {{ fieldError('email') }}
        </p>
      </div>
      <div>
        <label :for="`${uid}-phone`" class="label">
          {{ t('form.phone') }} <span class="normal-case tracking-normal text-bone-400">({{ t('form.optional') }})</span>
        </label>
        <input :id="`${uid}-phone`" v-model.trim="form.phone" type="tel" name="phone" autocomplete="tel" class="input-dark border-ink-500">
      </div>
      <div>
        <label :for="`${uid}-company`" class="label">
          {{ t('form.company') }} <span class="normal-case tracking-normal text-bone-400">({{ t('form.optional') }})</span>
        </label>
        <input :id="`${uid}-company`" v-model.trim="form.company" type="text" name="company" autocomplete="organization" class="input-dark border-ink-500">
      </div>
      <div :class="showVehicleSelect ? '' : 'sm:col-span-2'">
        <label :for="`${uid}-dates`" class="label">
          {{ t('form.dates') }} <span class="normal-case tracking-normal text-bone-400">({{ t('form.optional') }})</span>
        </label>
        <input :id="`${uid}-dates`" v-model.trim="form.dates" type="text" name="dates" :placeholder="t('form.datesPlaceholder')" class="input-dark border-ink-500">
      </div>
      <div v-if="showVehicleSelect">
        <label :for="`${uid}-vehicle`" class="label">
          {{ t('form.vehicle') }}
        </label>
        <div class="relative">
        <select :id="`${uid}-vehicle`" v-model="form.vehicle" name="vehicle" class="input-dark border-ink-500 font-normal appearance-none pr-10 truncate">
          <option value="">{{ t('form.generalInquiry') }}</option>
          <optgroup :label="t('nav.fleet')">
            <option v-for="v in allVehicles" :key="v.slug" :value="v.slug">
              {{ lt(v.name) }}
            </option>
          </optgroup>
          <optgroup :label="t('nav.equipment')">
            <option v-for="c in categories" :key="c.id" :value="`cat:${c.id}`">
              {{ categoryText(c.name) }}
            </option>
          </optgroup>
        </select>
        <svg class="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-bone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
        </div>
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
        class="input-dark border-ink-500 resize-y"
        :class="fieldError('message') ? '!border-signal-500' : ''"
        :aria-invalid="fieldError('message') ? 'true' : undefined"
        :aria-describedby="fieldError('message') ? `${uid}-message-error` : undefined"
      />
      <p v-if="fieldError('message')" :id="`${uid}-message-error`" class="mt-1.5 flex items-center gap-1.5 text-[13px] text-signal-400">
          <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {{ fieldError('message') }}
        </p>
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

    <div class="flex flex-wrap items-center gap-x-6 gap-y-3 pt-1">
      <button type="submit" class="btn-gold w-full sm:w-auto" :disabled="pending">
        {{ pending ? t('form.sending') : (submitLabel || t('form.submit')) }}
      </button>
      <p class="text-[13px] text-bone-100/85">{{ t('form.nextNote') }}</p>
    </div>
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
  /** The "fields marked * are required" line above the fields; a page that shows it elsewhere turns it off */
  legend?: boolean
}>(), {
  legend: true,
  endpoint: '/api/contact',
  submitLabel: '',
  messageRequired: false,
  showVehicleSelect: false,
  vehicle: undefined,
  interest: undefined,
  extraBody: undefined,
})

const emit = defineEmits<{ sent: [], reset: [] }>()

const { t } = useI18n()
const { lt } = useLocalized()
const contact = useRuntimeConfig().public.contact
const allVehicles = (await useVehicles()).all()
const { all: allCategories, text: categoryText } = await useEquipmentCategories()
const allEquipment = (await useEquipment()).all()
// Equipment categories that have something in them (the "what do you need" select)
const categories = allCategories().filter(c => allEquipment.some(e => e.category === c.id))
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
// The address the confirmation names (kept apart from the form, which is cleared for another go)
const sentTo = ref('')
const again = () => {
  form.message = ''
  form.dates = ''
  touchedSubmit.value = false
  sent.value = false
  emit('reset')
}
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

// Once the form has been submitted with mistakes, each message clears (or
// changes) as soon as its field is put right.
watch(() => [form.name, form.email, form.message], () => {
  if (touchedSubmit.value) validate()
})

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
      ?? (form.vehicle.startsWith('cat:')
        ? categoryText(categories.find(c => `cat:${c.id}` === form.vehicle)?.name)
        : form.vehicle ? lt(allVehicles.find(v => v.slug === form.vehicle)?.name) : '')
  }
  else {
    delete body.vehicle
  }

  pending.value = true
  try {
    await $fetch(props.endpoint, { method: 'POST', body })
    sentTo.value = form.email
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
