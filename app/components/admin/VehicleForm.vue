<template>
  <form ref="formEl" class="space-y-5" @submit.prevent="submit">
    <!-- Basics -->
    <section class="admin-card p-5 sm:p-6">
      <h2 class="admin-card-title">Basics</h2>
      <div class="mt-4 grid gap-5 sm:grid-cols-2">
        <div>
          <label class="admin-label">Name (English) *</label>
          <input v-model.trim="form.name.en" type="text" class="input-dark" @input="autoSlug">
        </div>
        <div>
          <label class="admin-label">Name (Icelandic)</label>
          <input v-model.trim="form.name.is" type="text" class="input-dark">
        </div>
        <div>
          <label class="admin-label">Category *</label>
          <select v-model="form.category" class="input-dark" required>
            <option value="" disabled>Choose a category…</option>
            <option v-for="c in CATEGORIES" :key="c" :value="c">{{ CATEGORY_LABELS[c] }}</option>
          </select>
        </div>
        <div>
          <label class="admin-label">Type</label>
          <select v-model="form.kind" class="input-dark">
            <option value="">No type page</option>
            <option v-for="k in vehicleKinds" :key="k" :value="k">{{ KIND_LABELS[k] }}</option>
          </select>
          <p class="mt-1 max-w-3xl text-xs text-bone-400">
            Also lists the vehicle on the website page for its type, such as Kassabílar or Kerrur. Pickups do not have a type page.
          </p>
        </div>
        <div>
          <label class="admin-label">Registration numbers</label>
          <div class="space-y-2">
            <div v-for="(_, i) in form.plates" :key="i" class="flex items-center gap-2">
              <input
                v-model.trim="form.plates[i]"
                type="text"
                class="input-dark font-mono uppercase"
                maxlength="12"
                :placeholder="`Unit ${i + 1}, e.g. ABC12`"
                :aria-label="`Registration number, unit ${i + 1}`"
                @keydown.enter.prevent="addPlate"
              >
              <button
                v-if="form.plates.length > 1"
                type="button"
                class="admin-icon-action-danger !ml-0"
                aria-label="Remove registration number"
                title="Remove registration number"
                @click="form.plates.splice(i, 1)"
              >
                <AdminIcon name="close" :size="16" />
              </button>
            </div>
          </div>
          <button type="button" class="btn-outline btn-sm mt-2" @click="addPlate">
            <AdminIcon name="plus" :size="16" /> Add registration number
          </button>
          <p class="mt-1 max-w-3xl text-xs text-bone-400">
            One per unit, so a listing with 4 caravans gets 4 numbers. Never shown on the website; used to prefill rental agreements under Contracts.
          </p>
        </div>
        <div>
          <label class="admin-label">Web address *</label>
          <input v-model.trim="form.slug" type="text" class="input-dark font-mono" placeholder="ford-transit-cargo-van" @input="slugTouched = true">
          <p class="mt-1 max-w-3xl text-xs text-bone-400">
            Page address: /vehicles/{{ form.slug || '…' }}
            <span v-if="isEdit" class="text-signal-500/80"> (changing it breaks links already shared).</span>
          </p>
        </div>
      </div>
      <label class="mt-4 flex items-center gap-2.5 text-sm text-bone-100 cursor-pointer">
        <input v-model="form.featured" type="checkbox" class="accent-gold-500 w-4 h-4">
        Featured: show on the home page
      </label>
    </section>

    <!-- Text -->
    <section class="admin-card p-5 sm:p-6">
      <h2 class="admin-card-title">Text</h2>
      <p class="mt-1 max-w-3xl text-xs text-bone-400">Icelandic fields are optional; the site falls back to English when empty.</p>
      <div class="mt-4 grid gap-5 sm:grid-cols-2">
        <div class="flex flex-col">
          <label class="admin-label">Tagline (English) *</label>
          <textarea v-model.trim="form.tagline.en" rows="2" class="input-dark admin-autogrow flex-1" />
        </div>
        <div class="flex flex-col">
          <label class="admin-label">Tagline (Icelandic)</label>
          <textarea v-model.trim="form.tagline.is" rows="2" class="input-dark admin-autogrow flex-1" />
        </div>
        <div>
          <label class="admin-label">Description (English)</label>
          <textarea v-model.trim="form.description.en" rows="7" class="input-dark resize-y" placeholder="Separate paragraphs with a blank line." />
        </div>
        <div>
          <label class="admin-label">Description (Icelandic)</label>
          <textarea v-model.trim="form.description.is" rows="7" class="input-dark resize-y" />
        </div>
      </div>
    </section>

    <!-- Highlights -->
    <section class="admin-card p-5 sm:p-6">
      <h2 class="admin-card-title">Highlights</h2>
      <p class="mt-1 max-w-3xl text-xs text-bone-400">3–5 film-relevant bullets shown on the detail page.</p>
      <div class="mt-4 space-y-3">
        <div v-for="(h, i) in form.highlights" :key="i" class="flex gap-3 items-start">
          <div class="grid gap-3 sm:grid-cols-2 flex-1">
            <input v-model.trim="h.en" type="text" class="input-dark" placeholder="English">
            <input v-model.trim="h.is" type="text" class="input-dark" placeholder="Icelandic">
          </div>
          <button type="button" class="admin-icon-action-danger !ml-0 mt-1" aria-label="Remove highlight" title="Remove highlight" @click="form.highlights.splice(i, 1)"><AdminIcon name="close" :size="16" /></button>
        </div>
      </div>
      <button type="button" class="btn-outline btn-sm mt-3" @click="form.highlights.push({ en: '', is: '' })">
        <AdminIcon name="plus" :size="16" /> Add highlight
      </button>
    </section>

    <!-- Photos -->
    <section class="admin-card p-5 sm:p-6">
      <h2 class="admin-card-title">Photos</h2>
      <p class="mt-1 max-w-3xl text-xs text-bone-400">The first photo is the card and social-share image. Order matters, so use the arrows.</p>

      <div v-if="form.images.length" class="mt-4 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        <div v-for="(src, i) in form.images" :key="src" class="relative group border border-ink-700">
          <img :src="src" alt="" class="w-full aspect-[3/2] object-cover bg-ink-800">
          <span v-if="i === 0" class="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-ink-950/80 text-gold-400 text-[10px] uppercase tracking-widest">Cover</span>
          <div class="absolute bottom-1.5 right-1.5 flex gap-1.5">
            <button v-if="i > 0" type="button" class="admin-icon-btn" title="Move left" aria-label="Move photo left" @click="move(i, -1)"><AdminIcon name="back" :size="14" /></button>
            <button v-if="i < form.images.length - 1" type="button" class="admin-icon-btn" title="Move right" aria-label="Move photo right" @click="move(i, 1)"><AdminIcon name="forward" :size="14" /></button>
            <button type="button" class="admin-icon-btn ml-1.5 hover:!text-signal-400" title="Remove photo" aria-label="Remove photo" @click="form.images.splice(i, 1)"><AdminIcon name="close" :size="14" /></button>
          </div>
        </div>
      </div>

      <div class="mt-4 flex flex-wrap items-center gap-3">
        <label class="btn-outline btn-sm cursor-pointer">
          <AdminIcon name="upload" :size="16" /> {{ uploading ? 'Uploading…' : 'Upload photos' }}
          <input type="file" accept="image/*" multiple class="hidden" :disabled="uploading" @change="upload">
        </label>
        <span class="text-xs text-bone-400">or</span>
        <input v-model.trim="imageUrl" type="url" class="input-dark !w-72 !py-2 text-xs" placeholder="https:// paste an image URL">
        <button type="button" class="btn-outline btn-sm" :disabled="!imageUrl" @click="addUrl">Add URL</button>
      </div>
      <p v-if="uploadError" class="mt-2 text-xs text-signal-500">{{ uploadError }}</p>
    </section>

    <!-- Specs -->
    <section class="admin-card p-5 sm:p-6">
      <h2 class="admin-card-title">Specs</h2>
      <p class="mt-1 max-w-3xl text-xs text-bone-400">Leave anything that doesn't apply empty; empty rows are hidden on the site.</p>
      <div class="mt-4 grid gap-5 grid-cols-2 lg:grid-cols-4">
        <div>
          <label class="admin-label">Units in fleet</label>
          <input v-model.number="form.specs.units" type="number" min="1" class="input-dark" placeholder="e.g. 4">
        </div>
        <div>
          <label class="admin-label">Seats</label>
          <input v-model.number="form.specs.seats" type="number" min="1" class="input-dark">
        </div>
        <div>
          <label class="admin-label">Sleeps</label>
          <input v-model.number="form.specs.sleeps" type="number" min="1" class="input-dark">
        </div>
        <div>
          <label class="admin-label">Length (m)</label>
          <input v-model.number="form.specs.lengthM" type="number" min="0" step="0.1" class="input-dark">
        </div>
        <div>
          <label class="admin-label">Height (m)</label>
          <input v-model.number="form.specs.heightM" type="number" min="0" step="0.1" class="input-dark">
        </div>
        <div>
          <label class="admin-label">Weight (kg)</label>
          <input v-model.number="form.specs.weightKg" type="number" min="0" class="input-dark" placeholder="e.g. 3500">
        </div>
        <div>
          <label class="admin-label">Towing capacity (kg)</label>
          <input v-model.number="form.specs.towingCapacityKg" type="number" min="0" class="input-dark" placeholder="empty = can't tow">
        </div>
        <div>
          <label class="admin-label">Payload / cargo (kg)</label>
          <input v-model.number="form.specs.payloadKg" type="number" min="0" class="input-dark" placeholder="carrying capacity in the back">
        </div>
        <div>
          <label class="admin-label">Box length (m)</label>
          <input v-model.number="form.specs.boxLengthM" type="number" min="0" step="0.1" class="input-dark" placeholder="cargo box, inside">
        </div>
        <div>
          <label class="admin-label">Box width (m)</label>
          <input v-model.number="form.specs.boxWidthM" type="number" min="0" step="0.1" class="input-dark">
        </div>
        <div>
          <label class="admin-label">Box height (m)</label>
          <input v-model.number="form.specs.boxHeightM" type="number" min="0" step="0.1" class="input-dark">
        </div>
        <div>
          <label class="admin-label">Drivetrain</label>
          <select v-model="form.specs.drivetrain" class="input-dark">
            <option value="">–</option>
            <option value="4x4">4x4</option>
            <option value="2wd">2WD</option>
            <option value="6x6">6x6</option>
          </select>
        </div>
        <div>
          <label class="admin-label">Transmission</label>
          <select v-model="form.specs.transmission" class="input-dark">
            <option value="">–</option>
            <option value="automatic">Automatic</option>
            <option value="manual">Manual</option>
          </select>
        </div>
        <div>
          <label class="admin-label">Fuel</label>
          <select v-model="form.specs.fuel" class="input-dark">
            <option value="">–</option>
            <option value="diesel">Diesel</option>
            <option value="petrol">Petrol</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
        <div>
          <label class="admin-label">Power output</label>
          <input v-model.trim="form.specs.powerOutput" type="text" class="input-dark" placeholder="230V / 3 kW generator">
        </div>
      </div>
      <div class="mt-5 grid gap-2.5 sm:grid-cols-3">
        <label v-for="flag in FLAGS" :key="flag.key" class="flex items-center gap-2.5 text-sm text-bone-100 cursor-pointer">
          <input v-model="form.specs[flag.key]" type="checkbox" class="accent-gold-500 w-4 h-4">
          {{ flag.label }}
        </label>
      </div>
      <div class="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <label class="admin-label">Extra spec note (English)</label>
          <input v-model.trim="form.specs.extra.en" type="text" class="input-dark">
        </div>
        <div>
          <label class="admin-label">Extra spec note (Icelandic)</label>
          <input v-model.trim="form.specs.extra.is" type="text" class="input-dark">
        </div>
      </div>
    </section>

    <!-- Save -->
    <div v-if="error" role="alert" class="border border-signal-500/50 bg-signal-500/10 p-4 text-sm">
      <p class="font-semibold text-signal-500">Could not save</p>
      <ul class="mt-1 text-bone-400 list-disc list-inside">
        <li v-for="(msg, i) in errorList" :key="i">{{ msg }}</li>
      </ul>
    </div>
    <div class="admin-savebar">
      <button type="submit" class="btn-gold" :disabled="saving">
        {{ saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create vehicle' }}
      </button>
      <NuxtLink to="/admin/vehicles" class="btn-outline">Cancel</NuxtLink>
      <button v-if="isEdit" type="button" class="admin-link ml-auto inline-flex items-center gap-2 !text-signal-400 !decoration-signal-500/40 hover:!text-signal-500" @click="emit('delete')">
        <AdminIcon name="trash" :size="16" /> Delete vehicle
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { Vehicle, VehicleCategory } from '~/types'
import { vehicleKinds } from '~/data/vehicleLandings'

const props = defineProps<{
  /** Existing vehicle when editing; omit when creating */
  vehicle?: Vehicle
  saving?: boolean
  error?: string | string[]
}>()

const emit = defineEmits<{ save: [payload: Record<string, unknown>], delete: [] }>()

const CATEGORIES: VehicleCategory[] = ['campers', 'equipment-cars', 'support-vehicles', 'trailers']
const CATEGORY_LABELS: Record<VehicleCategory, string> = {
  'campers': 'Campers',
  'equipment-cars': 'Equipment cars',
  'support-vehicles': 'Support vehicles',
  'trailers': 'Trailers',
}
const KIND_LABELS: Record<string, string> = {
  'box-truck': 'Box truck (kassabíll)',
  'cargo-van': 'Cargo van (sendibíll)',
  'caravan': 'Caravan (hjólhýsi)',
  'trailer': 'Trailer (kerra)',
  'atv': 'ATV (sexhjól)',
  'pickup': 'Pickup',
}
const FLAGS = [
  { key: 'generator', label: 'Generator' },
  { key: 'heating', label: 'Standing heat' },
  { key: 'blackoutReady', label: 'Blackout ready' },
  { key: 'winterEquipped', label: 'Winter equipped' },
  { key: 'towHitch', label: 'Tow hitch' },
  { key: 'wifi', label: 'Wi-Fi' },
] as const

const isEdit = computed(() => Boolean(props.vehicle))

const v = props.vehicle
const form = reactive({
  slug: v?.slug ?? '',
  category: v?.category ?? ('' as VehicleCategory), // a new vehicle starts with no category picked
  kind: v?.kind ?? '',
  featured: v?.featured ?? false,
  name: { en: v?.name.en ?? '', is: v?.name.is ?? '' },
  tagline: { en: v?.tagline.en ?? '', is: v?.tagline.is ?? '' },
  description: { en: v?.description.en ?? '', is: v?.description.is ?? '' },
  highlights: (v?.highlights ?? []).map(h => ({ en: h.en ?? '', is: h.is ?? '' })),
  images: [...(v?.images ?? [])],
  plates: v?.plates?.length ? [...v.plates] : [''], // one field per unit
  specs: {
    units: v?.specs.units ?? ('' as number | ''),
    seats: v?.specs.seats ?? ('' as number | ''),
    sleeps: v?.specs.sleeps ?? ('' as number | ''),
    lengthM: v?.specs.lengthM ?? ('' as number | ''),
    heightM: v?.specs.heightM ?? ('' as number | ''),
    weightKg: v?.specs.weightKg ?? ('' as number | ''),
    towingCapacityKg: v?.specs.towingCapacityKg ?? ('' as number | ''),
    payloadKg: v?.specs.payloadKg ?? ('' as number | ''),
    boxLengthM: v?.specs.boxLengthM ?? ('' as number | ''),
    boxWidthM: v?.specs.boxWidthM ?? ('' as number | ''),
    boxHeightM: v?.specs.boxHeightM ?? ('' as number | ''),
    drivetrain: v?.specs.drivetrain ?? '',
    transmission: v?.specs.transmission ?? '',
    fuel: v?.specs.fuel ?? '',
    powerOutput: v?.specs.powerOutput ?? '',
    generator: v?.specs.generator ?? false,
    heating: v?.specs.heating ?? false,
    blackoutReady: v?.specs.blackoutReady ?? false,
    winterEquipped: v?.specs.winterEquipped ?? false,
    towHitch: v?.specs.towHitch ?? false,
    wifi: v?.specs.wifi ?? false,
    extra: { en: v?.specs.extra?.en ?? '', is: v?.specs.extra?.is ?? '' },
  },
})
if (!form.highlights.length) form.highlights.push({ en: '', is: '' })

const addPlate = async () => {
  form.plates.push('')
  await nextTick()
  plateInputs()?.at(-1)?.focus()
}
const formEl = useTemplateRef<HTMLFormElement>('formEl')
const plateInputs = () =>
  formEl.value ? Array.from(formEl.value.querySelectorAll<HTMLInputElement>('input[aria-label^="Registration number"]')) : null

// ── Slug auto-fill (new vehicles only, until the user edits it by hand) ─────
const slugTouched = ref(isEdit.value)
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[áàâä]/g, 'a').replace(/[éèêë]/g, 'e').replace(/[íìîï]/g, 'i')
    .replace(/[óòôö]/g, 'o').replace(/[úùûü]/g, 'u').replace(/[ýÿ]/g, 'y')
    .replace(/ð/g, 'd').replace(/þ/g, 'th').replace(/æ/g, 'ae')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
const autoSlug = () => {
  if (!slugTouched.value) form.slug = slugify(form.name.en)
}

// ── Photos ───────────────────────────────────────────────────────────────────
const uploading = ref(false)
const uploadError = ref('')
const imageUrl = ref('')

const upload = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  if (!files.length) return
  uploading.value = true
  uploadError.value = ''
  try {
    for (const file of files) {
      const body = new FormData()
      body.append('file', file)
      const res = await $fetch<{ url: string }>('/api/admin/upload', { method: 'POST', body })
      form.images.push(res.url)
    }
  }
  catch (err: any) {
    uploadError.value = err?.data?.statusMessage || 'Upload failed.'
  }
  finally {
    uploading.value = false
  }
}

const addUrl = () => {
  if (imageUrl.value && !form.images.includes(imageUrl.value)) form.images.push(imageUrl.value)
  imageUrl.value = ''
}

const move = (i: number, dir: number) => {
  const j = i + dir
  const arr = form.images
  ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
}

// ── Submit ───────────────────────────────────────────────────────────────────
const errorList = computed(() =>
  Array.isArray(props.error) ? props.error : props.error ? [props.error] : [],
)

const submit = () => {
  emit('save', {
    slug: form.slug,
    category: form.category,
    kind: form.kind || undefined,
    featured: form.featured,
    name: form.name,
    tagline: form.tagline,
    description: form.description,
    highlights: form.highlights.filter(h => h.en || h.is),
    images: form.images,
    // A pasted "ABC12, DEF34" in one field still becomes two numbers.
    plates: form.plates.flatMap(p => p.split(/[,;]/)).map(p => p.trim()).filter(Boolean),
    specs: {
      ...form.specs,
      units: form.specs.units || undefined,
      seats: form.specs.seats || undefined,
      sleeps: form.specs.sleeps || undefined,
      lengthM: form.specs.lengthM || undefined,
      heightM: form.specs.heightM || undefined,
      weightKg: form.specs.weightKg || undefined,
      towingCapacityKg: form.specs.towingCapacityKg || undefined,
      payloadKg: form.specs.payloadKg || undefined,
      boxLengthM: form.specs.boxLengthM || undefined,
      boxWidthM: form.specs.boxWidthM || undefined,
      boxHeightM: form.specs.boxHeightM || undefined,
      drivetrain: form.specs.drivetrain || undefined,
      transmission: form.specs.transmission || undefined,
      fuel: form.specs.fuel || undefined,
    },
  })
}
</script>

<style scoped>
.admin-label {
  @apply block text-xs uppercase tracking-widest text-bone-400 mb-1.5;
}
.admin-icon-btn {
  @apply w-8 h-8 flex items-center justify-center bg-ink-950/80 text-bone-100 text-xs
    hover:text-gold-400 transition-colors;
}
</style>
