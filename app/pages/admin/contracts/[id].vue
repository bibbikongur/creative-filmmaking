<template>
  <div v-if="contract">
    <AdminPageHeader :crumbs="[{ label: 'Sales' }, { label: 'Contracts', to: '/admin/contracts' }, { label: contract.number }]">
      <template #title>
        Rental agreement <span class="text-gold-400 font-mono">{{ contract.number }}</span>
      </template>
      <template #description>
        <template v-if="contract.quoteId">
          From quote
          <NuxtLink :to="`/admin/quotes/${contract.quoteId}`" class="text-gold-400 hover:text-gold-500 transition-colors">{{ contract.quoteId }}</NuxtLink><span v-if="contract.offerId">, offer #{{ contract.offerId }}</span>.{{ ' ' }}
        </template>
        <template v-else>Filled in by hand.{{ ' ' }}</template>
        <template v-if="!d.vehicles.length">Add the vehicles below to finish it.</template>
        <template v-else>
          Prints as a {{ effectiveTemplate === 'multi' ? 'multi-vehicle' : 'single-vehicle' }} agreement with the terms,
          {{ annexSheets }} condition {{ annexSheets === 1 ? 'record' : 'records' }}{{ needsAnnexB ? ' and the driver list' : '' }}.
        </template>
      </template>
    </AdminPageHeader>
    <p v-if="saveError" class="mt-4 text-sm text-signal-500">{{ saveError }}</p>

    <form class="mt-6 space-y-5" @submit.prevent="save()">
      <!-- Agreement -->
      <section class="admin-card p-5 sm:p-6">
        <h2 class="admin-card-title">Agreement</h2>
        <div class="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label class="admin-label">Date of agreement</label>
            <input v-model="d.agreementDate" type="date" class="input-dark">
          </div>
          <div>
            <label class="admin-label">Layout</label>
            <select v-model="d.template" class="input-dark">
              <option value="auto">Automatic</option>
              <option value="single">Single vehicle</option>
              <option value="multi">Multiple vehicles</option>
            </select>
          </div>
          <div>
            <label class="admin-label">Signed at (place, date)</label>
            <input v-model.trim="d.placeAndDate" type="text" class="input-dark" placeholder="e.g. Mosfellsbær, 12.08.2026">
          </div>
          <div>
            <label class="admin-label">Rental licence no.</label>
            <input v-model.trim="d.licenceNo" type="text" class="input-dark" placeholder="Optional, prints in the footer">
          </div>
        </div>
      </section>

      <!-- Renter -->
      <section class="admin-card p-5 sm:p-6">
        <h2 class="admin-card-title">Renter</h2>
        <div class="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div class="lg:col-span-2">
            <label class="admin-label">Full name (and company)</label>
            <input v-model.trim="d.renter.name" type="text" class="input-dark">
          </div>
          <div>
            <label class="admin-label">Kennitala / date of birth</label>
            <input v-model.trim="d.renter.idNo" type="text" class="input-dark">
          </div>
          <div>
            <label class="admin-label">Mobile phone</label>
            <input v-model.trim="d.renter.phone" type="text" class="input-dark">
          </div>
          <div class="lg:col-span-2">
            <label class="admin-label">Home address (street, city, country)</label>
            <input v-model.trim="d.renter.address" type="text" class="input-dark">
          </div>
          <div>
            <label class="admin-label">Email</label>
            <input v-model.trim="d.renter.email" type="text" class="input-dark">
          </div>
          <div>
            <label class="admin-label">Passport / ID card no.</label>
            <input v-model.trim="d.renter.passportNo" type="text" class="input-dark">
          </div>
          <div>
            <label class="admin-label">Driving licence no.</label>
            <input v-model.trim="d.renter.licenceNo" type="text" class="input-dark">
          </div>
          <div>
            <label class="admin-label">Licence country / expiry</label>
            <input v-model.trim="d.renter.licenceCountryExpiry" type="text" class="input-dark" placeholder="e.g. Iceland / 2031">
          </div>
        </div>
      </section>

      <!-- Drivers -->
      <section class="admin-card p-5 sm:p-6">
        <h2 class="admin-card-title">Authorised drivers</h2>
          <p class="mt-1 max-w-3xl text-xs text-bone-400">The first three print on page 1; further drivers go on the driver list (annex B).</p>
        <div v-if="d.drivers.length" class="mt-4 space-y-3">
          <div v-for="(drv, i) in d.drivers" :key="i" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-[auto_1fr_1fr_1fr_1fr_1fr_1fr_auto] items-center">
            <span class="hidden lg:block text-xs text-bone-400 w-5 text-right tabular-nums">{{ i + 1 }}</span>
            <input v-model.trim="drv.name" type="text" class="input-dark !py-2 text-sm" placeholder="Full name">
            <input v-model.trim="drv.idNo" type="text" class="input-dark !py-2 text-sm" placeholder="ID no. / date of birth">
            <input v-model.trim="drv.licenceNo" type="text" class="input-dark !py-2 text-sm" placeholder="Driving licence no.">
            <input v-model.trim="drv.issuingCountry" type="text" class="input-dark !py-2 text-sm" placeholder="Issuing country">
            <input v-model.trim="drv.expiry" type="text" class="input-dark !py-2 text-sm" placeholder="Expiry (annex B)">
            <input v-model.trim="drv.phone" type="text" class="input-dark !py-2 text-sm" placeholder="Phone (annex B)">
            <button type="button" class="admin-icon-action-danger !ml-0 justify-self-end" aria-label="Remove driver" title="Remove driver" @click="d.drivers.splice(i, 1)"><AdminIcon name="close" :size="16" /></button>
          </div>
        </div>
        <button type="button" class="btn-outline btn-sm mt-4" @click="d.drivers.push(blankDriver())"><AdminIcon name="plus" :size="16" /> Add driver</button>
      </section>

      <!-- Vehicles -->
      <section class="admin-card p-5 sm:p-6">
        <h2 class="admin-card-title">Vehicles and rental period</h2>
          <p class="mt-1 max-w-3xl text-xs text-bone-400">One line per vehicle; each gets its own condition record (annex A).</p>

        <div class="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label class="admin-label">Pickup location</label>
            <input v-model.trim="d.pickupLocation" type="text" class="input-dark" placeholder="e.g. Spóahöfði 24, Mosfellsbær">
          </div>
          <div>
            <label class="admin-label">Return location</label>
            <input v-model.trim="d.returnLocation" type="text" class="input-dark" placeholder="Same as pickup">
          </div>
          <div>
            <label class="admin-label">Kilometres included</label>
            <div class="flex items-center gap-3 h-[42px]">
              <label class="flex items-center gap-2 text-sm text-bone-100 cursor-pointer">
                <input v-model="d.kmUnlimited" type="checkbox" class="accent-gold-500 w-4 h-4"> Unlimited
              </label>
              <input
                v-if="!d.kmUnlimited"
                v-model.number="kmPerDay"
                type="number"
                min="0"
                class="input-dark !w-28 !py-2 text-sm"
                placeholder="km/day"
              >
            </div>
          </div>
        </div>

        <div class="mt-6 space-y-4">
          <div v-for="(v, i) in d.vehicles" :key="i" class="border border-ink-800 bg-ink-950/40 p-4">
            <div class="flex items-center justify-between gap-3">
              <p class="admin-eyebrow">Vehicle {{ i + 1 }}</p>
              <button type="button" class="admin-icon-action-danger !ml-0" aria-label="Remove vehicle" title="Remove vehicle" @click="d.vehicles.splice(i, 1)"><AdminIcon name="close" :size="16" /></button>
            </div>
            <div class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div class="lg:col-span-2">
                <label class="admin-label">Make and model</label>
                <input v-model.trim="v.makeModel" type="text" class="input-dark !py-2 text-sm">
              </div>
              <div>
                <label class="admin-label">Reg. no.</label>
                <input
                  v-model.trim="v.regNo"
                  type="text"
                  class="input-dark !py-2 text-sm font-mono uppercase"
                  :list="`plates-${i}`"
                  placeholder="ABC12"
                >
                <datalist :id="`plates-${i}`">
                  <option v-for="p in platesFor(v)" :key="p" :value="p" />
                </datalist>
              </div>
              <div>
                <label class="admin-label">Fuel</label>
                <select v-model="v.fuel" class="input-dark !py-2 text-sm">
                  <option value="">–</option>
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                  <option value="electric">Electric</option>
                </select>
              </div>
              <div>
                <label class="admin-label">Pickup date, hour</label>
                <input v-model.trim="v.pickupAt" type="text" class="input-dark !py-2 text-sm" placeholder="12.08.2026 09:00">
              </div>
              <div>
                <label class="admin-label">Return date, hour</label>
                <input v-model.trim="v.returnAt" type="text" class="input-dark !py-2 text-sm" placeholder="18.08.2026 17:00">
              </div>
              <div>
                <label class="admin-label">Km out</label>
                <input v-model.trim="v.kmOut" type="text" class="input-dark !py-2 text-sm" placeholder="Odometer at pickup">
              </div>
              <div>
                <label class="admin-label">{{ d.currency }} / day</label>
                <input v-model.number="v.ratePerDay" type="number" min="0" step="any" class="input-dark !py-2 text-sm" @input="nullIfEmpty(v, 'ratePerDay', $event)">
              </div>
              <div>
                <label class="admin-label">Condition record (annex A)</label>
                <select v-model="v.annexKind" class="input-dark !py-2 text-sm">
                  <option value="pickup">Pickup truck diagram</option>
                  <option value="van">Van diagram</option>
                  <option value="box">Box truck diagram</option>
                  <option value="generic">No diagram (photos)</option>
                  <option value="none">No condition record</option>
                </select>
              </div>
              <label class="flex items-center gap-2 text-sm text-bone-100 cursor-pointer self-end pb-2.5">
                <input v-model="v.fRoads" type="checkbox" class="accent-gold-500 w-4 h-4">
                F-roads permitted (4x4 only)
              </label>
            </div>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap items-center gap-3">
          <select v-model="addVehicleId" class="input-dark !w-auto !py-2 text-sm">
            <option value="">Add from the fleet…</option>
            <option v-for="fv in fleet" :key="fv.id" :value="fv.id">{{ fv.name.en }}{{ fv.plates?.length ? ` (${fv.plates.join(', ')})` : '' }}</option>
            <option value="blank">Blank line</option>
          </select>
          <button type="button" class="btn-outline btn-sm" :disabled="!addVehicleId" @click="addVehicle"><AdminIcon name="plus" :size="16" /> Add vehicle</button>
        </div>
      </section>

      <!-- Charges -->
      <section class="admin-card p-5 sm:p-6">
        <h2 class="admin-card-title">Charges and payment</h2>
          <p class="mt-1 max-w-3xl text-xs text-bone-400">Amounts print as entered. Leave a field empty to print a blank.</p>
        <div class="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label class="admin-label">Currency</label>
            <select v-model="d.currency" class="input-dark">
              <option value="ISK">ISK</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          <div>
            <label class="admin-label">VAT % (0 = without VAT)</label>
            <input v-model.number="d.vatRate" type="number" min="0" max="100" class="input-dark">
          </div>
        </div>

        <div class="mt-5 grid gap-x-5 gap-y-3 lg:grid-cols-[1fr_7rem_9rem_9rem] items-end">
          <!-- One header for the three charge lines (each field keeps its own label on small screens) -->
          <span class="admin-eyebrow hidden lg:block">Charge</span>
          <span class="admin-eyebrow hidden lg:block">Quantity</span>
          <span class="admin-eyebrow hidden lg:block">Rate ({{ d.currency }})</span>
          <span class="admin-eyebrow hidden lg:block">Amount ({{ d.currency }})</span>

          <p class="text-sm font-medium text-bone-100 lg:pb-2.5">Vehicle rental</p>
          <NumField v-model="d.charges.rentalDays" label="Days" />
          <NumField v-model="d.charges.rentalRate" :label="`${d.currency}/day`" />
          <NumField v-model="d.charges.rental" :label="`Amount (${d.currency})`" strong />

          <p class="text-sm font-medium text-bone-100 lg:pb-2.5">Insurance (Gold)</p>
          <NumField v-model="d.charges.insuranceDays" label="Days" />
          <NumField v-model="d.charges.insuranceRate" :label="`${d.currency}/day`" />
          <NumField v-model="d.charges.insurance" :label="`Amount (${d.currency})`" strong />

          <div class="lg:col-span-1">
            <label class="sr-only" for="extras-text">Additional drivers and extras</label>
            <input id="extras-text" v-model.trim="d.charges.extrasText" type="text" class="input-dark !py-2 text-sm" placeholder="Additional drivers and extras, e.g. 2 heaters">
          </div>
          <NumField v-model="d.charges.driversCount" label="Drivers" />
          <NumField v-model="d.charges.driversRate" :label="`${d.currency} per driver per day`" />
          <NumField v-model="d.charges.extras" :label="`Amount (${d.currency})`" strong />

          <p class="text-sm font-semibold text-bone-100 lg:col-span-2 lg:pb-2.5">Total {{ d.vatRate > 0 ? `incl. ${d.vatRate}% VAT` : 'excl. VAT' }}</p>
          <p class="text-xs text-ink-400 lg:pb-3 lg:text-right">Sum of lines: {{ formatMoney(sumOfLines) }}</p>
          <NumField v-model="d.charges.total" :label="`Total (${d.currency})`" strong />
        </div>

        <div class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label class="admin-label">Payment method</label>
            <select v-model="d.paymentMethod" class="input-dark">
              <option value="">–</option>
              <option value="card">Card</option>
              <option value="bank">Bank transfer</option>
              <option value="invoice">Invoice</option>
            </select>
          </div>
          <div>
            <label class="admin-label">Invoice / PO reference</label>
            <input v-model.trim="d.paymentRef" type="text" class="input-dark">
          </div>
          <div>
            <label class="admin-label">Paid when</label>
            <select v-model="d.paymentTiming" class="input-dark">
              <option value="">–</option>
              <option value="pickup">Paid at pickup</option>
              <option value="invoice">Invoice</option>
              <option value="return">Paid at return</option>
            </select>
          </div>
          <div>
            <label for="driver-days" class="admin-label">Driver days</label>
            <input id="driver-days" v-model.number="driversDays" type="number" min="0" class="input-dark">
            <p class="mt-1 text-xs text-ink-400">Single-vehicle layout only.</p>
          </div>
        </div>
      </section>

      <!-- Condition + annexes -->
      <section class="admin-card p-5 sm:p-6">
        <h2 class="admin-card-title">Condition at pickup and annexes</h2>
        <div class="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <label class="admin-label">Existing damage</label>
            <input v-model.trim="d.existingDamage" type="text" class="input-dark" placeholder="e.g. scratch on rear bumper, see annex A">
            <p class="mt-1 text-xs text-ink-400">Single-vehicle layout only. The multi-vehicle layout prints “recorded on annex A”.</p>
          </div>
          <div class="flex flex-wrap gap-x-6 gap-y-3 self-start sm:pt-8">
            <label class="flex items-center gap-2 text-sm text-bone-100 cursor-pointer">
              <input v-model="d.annexA" type="checkbox" class="accent-gold-500 w-4 h-4"> Annex A attached (condition records)
            </label>
            <label class="flex items-center gap-2 text-sm text-bone-100 cursor-pointer">
              <input v-model="d.photosTaken" type="checkbox" class="accent-gold-500 w-4 h-4"> Photos taken at pickup
            </label>
            <label class="flex items-center gap-2 text-sm text-bone-100 cursor-pointer">
              <input v-model="d.annexB" type="checkbox" class="accent-gold-500 w-4 h-4" :disabled="d.drivers.length > 3">
              Annex B driver list {{ d.drivers.length > 3 ? '(needed: more than three drivers)' : '' }}
            </label>
          </div>
          <div>
            <label class="admin-label">Annex B · contact person and phone</label>
            <input v-model.trim="d.annexBContact" type="text" class="input-dark">
          </div>
          <div>
            <label class="admin-label">Annex B · project / production</label>
            <input v-model.trim="d.annexBProject" type="text" class="input-dark">
          </div>
        </div>
      </section>

      <div class="admin-savebar">
        <button v-if="dirty || saving" type="submit" class="btn-gold" :disabled="saving">
          {{ saving ? 'Saving…' : 'Save changes' }}
        </button>
        <button type="button" :class="dirty || saving ? 'btn-outline' : 'btn-gold'" :disabled="saving" @click="preview">View PDF</button>
        <button type="button" class="btn-outline" :disabled="saving" @click="print">
          <AdminIcon name="print" :size="16" /> Print
        </button>
        <span class="text-xs" :class="dirty ? 'text-gold-400' : 'text-ink-400'" role="status">{{ saving ? 'Saving…' : dirty ? 'Unsaved changes' : 'All changes saved' }}</span>
        <button type="button" class="admin-link ml-auto inline-flex items-center gap-2 !text-signal-400 !decoration-signal-500/40 hover:!text-signal-500" @click="remove">
          <AdminIcon name="trash" :size="16" /> Delete agreement
        </button>
      </div>
    </form>

    <ContractPdfViewer :src="viewerSrc" :title="`Rental agreement ${contract.number}`" @close="viewerSrc = null" />
  </div>

  <AdminStateMessage v-else-if="loadError" kind="error">
    {{ loadError }}
    <template #action>
      <NuxtLink to="/admin/contracts" class="btn-outline btn-sm">Back to contracts</NuxtLink>
    </template>
  </AdminStateMessage>
  <AdminStateMessage v-else kind="loading">Loading…</AdminStateMessage>
</template>

<script setup lang="ts">
import { defineComponent, h } from 'vue'
import type { ContractDriver, ContractVehicle, RentalContract, RentalContractData, Vehicle } from '~/types'

definePageMeta({ layout: 'admin' })
const { alertDialog, confirmDialog } = useAppDialog()

const route = useRoute()
const contract = ref<RentalContract | null>(null)
const fleet = ref<Vehicle[]>([])
const loadError = ref('')
const saving = ref(false)
const saveError = ref('')
const savedSnapshot = ref('')

// The editable document. A fresh object per load so `dirty` compares cleanly.
const d = reactive<RentalContractData>(blankData())

function blankData(): RentalContractData {
  return {
    template: 'auto', agreementDate: '', renter: { name: '', idNo: '', phone: '', passportNo: '', address: '', email: '', licenceNo: '', licenceCountryExpiry: '' },
    drivers: [], pickupLocation: '', returnLocation: '', kmUnlimited: true, kmPerDay: null, vehicles: [], currency: 'ISK', vatRate: 24,
    charges: { rentalDays: null, rentalRate: null, rental: null, insuranceDays: null, insuranceRate: null, insurance: null, driversCount: null, driversDays: null, driversRate: null, extrasText: '', extras: null, total: null },
    paymentMethod: '', paymentRef: '', paymentTiming: '', existingDamage: '', annexA: true, photosTaken: false, annexB: false,
    annexBContact: '', annexBProject: '', placeAndDate: '', licenceNo: '',
  }
}

const blankDriver = (): ContractDriver => ({ name: '', idNo: '', licenceNo: '', issuingCountry: '', expiry: '', phone: '' })
const blankVehicle = (): ContractVehicle => ({
  makeModel: '', regNo: '', fuel: '', pickupAt: '', returnAt: '', kmOut: '', fRoads: false, ratePerDay: null, annexKind: 'generic',
})

const load = async () => {
  loadError.value = ''
  try {
    const [c, f] = await Promise.all([
      $fetch<RentalContract>(`/api/admin/contracts/${route.params.id}`, { query: { t: Date.now() } }),
      $fetch<Vehicle[]>('/api/admin/vehicles', { query: { t: Date.now() } }).catch(() => [] as Vehicle[]),
    ])
    fleet.value = f
    Object.assign(d, JSON.parse(JSON.stringify(c.data)))
    contract.value = c
    savedSnapshot.value = JSON.stringify(d)
  }
  catch (e: any) {
    loadError.value = e?.statusCode === 404 ? 'Agreement not found.' : 'Could not load the agreement.'
  }
}
onMounted(load)

const dirty = computed(() => JSON.stringify(d) !== savedSnapshot.value)

// Number inputs bound to nullable fields: an empty box means "print nothing".
const kmPerDay = computed({
  get: () => d.kmPerDay ?? ('' as number | ''),
  set: v => { d.kmPerDay = v === '' || v === null || Number.isNaN(v) ? null : Number(v) },
})
const driversDays = computed({
  get: () => d.charges.driversDays ?? ('' as number | ''),
  set: v => { d.charges.driversDays = v === '' || v === null || Number.isNaN(v) ? null : Number(v) },
})
const nullIfEmpty = (obj: Record<string, unknown>, key: string, e: Event) => {
  if ((e.target as HTMLInputElement).value === '') obj[key] = null
}

/** Compact labelled number input for the charges grid; empty = null. */
const NumField = defineComponent({
  props: { modelValue: { type: null as unknown as () => number | null, default: null }, label: { type: String, required: true }, strong: Boolean },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => h('div', [
      h('label', { class: 'admin-label lg:sr-only' }, props.label),
      h('input', {
        type: 'number', min: 0, step: 'any',
        class: ['input-dark !py-2 text-sm tabular-nums', props.strong ? 'font-semibold' : ''],
        value: props.modelValue ?? '',
        onInput: (e: Event) => {
          const raw = (e.target as HTMLInputElement).value
          emit('update:modelValue', raw === '' ? null : Number(raw))
        },
      }),
    ])
  },
})

const effectiveTemplate = computed(() =>
  d.template === 'auto' ? (d.vehicles.length > 1 ? 'multi' : 'single') : d.template)
const needsAnnexB = computed(() => d.annexB || d.drivers.length > 3)
const annexSheets = computed(() => {
  if (!d.annexA) return 0
  const vs = effectiveTemplate.value === 'single' ? d.vehicles.slice(0, 1) : d.vehicles
  return vs.filter(v => v.annexKind !== 'none').length
})
const sumOfLines = computed(() => (d.charges.rental ?? 0) + (d.charges.insurance ?? 0) + (d.charges.extras ?? 0))
const formatMoney = (n: number) => d.currency === 'EUR'
  ? `€${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  : `${Math.round(n).toLocaleString('is-IS')} kr.`

// Plate suggestions: the catalogue vehicle's own plates first, then the whole fleet.
const platesFor = (v: ContractVehicle): string[] => {
  const own = fleet.value.find(f => f.id === v.vehicleId)?.plates ?? []
  const all = fleet.value.flatMap(f => f.plates ?? [])
  return [...new Set([...own, ...all])]
}

const addVehicleId = ref('')
const addVehicle = () => {
  const id = addVehicleId.value
  addVehicleId.value = ''
  if (!id) return
  const fv = fleet.value.find(f => f.id === id)
  const prev = d.vehicles.at(-1)
  d.vehicles.push({
    ...blankVehicle(),
    ...(fv ? { vehicleId: fv.id, makeModel: fv.name.en } : {}),
    regNo: fv?.plates?.length === 1 ? fv.plates[0]! : '',
    fuel: fv?.specs.fuel === 'diesel' ? 'diesel' : fv?.specs.fuel === 'petrol' ? 'petrol' : '',
    annexKind: fv?.kind === 'pickup' ? 'pickup' : fv?.kind === 'cargo-van' ? 'van' : fv?.kind === 'box-truck' ? 'box' : 'generic',
    pickupAt: prev?.pickupAt ?? '',
    returnAt: prev?.returnAt ?? '',
  })
}

const save = async (): Promise<boolean> => {
  if (!contract.value) return false
  saving.value = true
  saveError.value = ''
  try {
    const c = await $fetch<RentalContract>(`/api/admin/contracts/${contract.value.id}`, { method: 'PUT', body: d })
    Object.assign(d, JSON.parse(JSON.stringify(c.data)))
    contract.value = c
    savedSnapshot.value = JSON.stringify(d)
    return true
  }
  catch (e: any) {
    saveError.value = e?.data?.statusMessage || 'Could not save the agreement.'
    return false
  }
  finally {
    saving.value = false
  }
}

const print = async () => {
  if (!contract.value) return
  // Open the tab first so the browser treats it as a user click, then navigate it once saved.
  const tab = window.open('', '_blank')
  const ok = await save()
  if (!ok) {
    tab?.close()
    return
  }
  const url = `/api/admin/contracts/${contract.value.id}/pdf?t=${Date.now()}`
  if (tab) tab.location.href = url
  else window.open(url, '_blank')
}

// In-page viewer. The PDF is built from the stored agreement, so unsaved edits are saved first.
const viewerSrc = ref<string | null>(null)
const preview = async () => {
  if (!contract.value) return
  if (dirty.value && !await save()) return
  viewerSrc.value = `/api/admin/contracts/${contract.value.id}/pdf?t=${Date.now()}`
}

const remove = async () => {
  if (!contract.value) return
  if (!await confirmDialog(`Delete agreement ${contract.value.number}? This cannot be undone.`)) return
  try {
    await $fetch(`/api/admin/contracts/${contract.value.id}`, { method: 'DELETE' })
    savedSnapshot.value = JSON.stringify(d)
    await navigateTo('/admin/contracts')
  }
  catch (e: any) {
    await alertDialog(e?.data?.statusMessage || 'Delete failed.')
  }
}

// Warn before leaving with unsaved edits.
onBeforeRouteLeave(() => {
  if (dirty.value && !window.confirm('You have unsaved changes. Leave without saving?')) return false
})
const beforeUnload = (e: BeforeUnloadEvent) => {
  if (dirty.value) e.preventDefault()
}
onMounted(() => window.addEventListener('beforeunload', beforeUnload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))

useHead({ title: 'Rental agreement · Admin · Creative Filmmaking' })
</script>

<style scoped>
.admin-label {
  @apply block text-xs uppercase tracking-widest text-bone-400 mb-1.5;
}
.admin-icon-btn {
  @apply w-7 h-7 flex items-center justify-center bg-ink-950/80 text-bone-100 text-xs
    hover:text-gold-400 transition-colors;
}
</style>
