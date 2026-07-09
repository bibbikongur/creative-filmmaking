<template>
  <form class="space-y-10" @submit.prevent="submit">
    <!-- Basics -->
    <section>
      <h2 class="text-sm font-heading font-semibold uppercase tracking-widest text-gold-500">Basics</h2>
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
          <label class="admin-label">URL slug *</label>
          <input v-model.trim="form.slug" type="text" class="input-dark font-mono" placeholder="arctic-base-4x4-camper" @input="slugTouched = true">
          <p class="mt-1 text-xs text-bone-400">
            Page address: /vehicles/{{ form.slug || '…' }}
            <span v-if="isEdit" class="text-signal-500/80"> (changing it breaks links already shared).</span>
          </p>
        </div>
        <div>
          <label class="admin-label">Category *</label>
          <select v-model="form.category" class="input-dark">
            <option v-for="c in CATEGORIES" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
      </div>
      <label class="mt-4 flex items-center gap-2.5 text-sm text-bone-100 cursor-pointer">
        <input v-model="form.featured" type="checkbox" class="accent-gold-500 w-4 h-4">
        Featured: show on the home page
      </label>
    </section>

    <!-- Text -->
    <section>
      <h2 class="text-sm font-heading font-semibold uppercase tracking-widest text-gold-500">Text</h2>
      <p class="mt-1 text-xs text-bone-400">Icelandic fields are optional; the site falls back to English when empty.</p>
      <div class="mt-4 grid gap-5 sm:grid-cols-2">
        <div>
          <label class="admin-label">Tagline (English) *</label>
          <input v-model.trim="form.tagline.en" type="text" class="input-dark">
        </div>
        <div>
          <label class="admin-label">Tagline (Icelandic)</label>
          <input v-model.trim="form.tagline.is" type="text" class="input-dark">
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
    <section>
      <h2 class="text-sm font-heading font-semibold uppercase tracking-widest text-gold-500">Highlights</h2>
      <p class="mt-1 text-xs text-bone-400">3–5 film-relevant bullets shown on the detail page.</p>
      <div class="mt-4 space-y-3">
        <div v-for="(h, i) in form.highlights" :key="i" class="flex gap-3 items-start">
          <div class="grid gap-3 sm:grid-cols-2 flex-1">
            <input v-model.trim="h.en" type="text" class="input-dark" placeholder="English">
            <input v-model.trim="h.is" type="text" class="input-dark" placeholder="Icelandic">
          </div>
          <button type="button" class="admin-icon-btn mt-2" title="Remove" @click="form.highlights.splice(i, 1)">✕</button>
        </div>
      </div>
      <button type="button" class="btn-ghost !px-4 !py-2 !text-xs mt-3" @click="form.highlights.push({ en: '', is: '' })">
        + Add highlight
      </button>
    </section>

    <!-- Photos -->
    <section>
      <h2 class="text-sm font-heading font-semibold uppercase tracking-widest text-gold-500">Photos</h2>
      <p class="mt-1 text-xs text-bone-400">The first photo is the card and social-share image. Order matters, so use the arrows.</p>

      <div v-if="form.images.length" class="mt-4 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        <div v-for="(src, i) in form.images" :key="src" class="relative group border border-ink-700">
          <img :src="src" alt="" class="w-full aspect-[3/2] object-cover bg-ink-800">
          <span v-if="i === 0" class="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-ink-950/80 text-gold-400 text-[10px] uppercase tracking-widest">Cover</span>
          <div class="absolute bottom-1.5 right-1.5 flex gap-1.5">
            <button v-if="i > 0" type="button" class="admin-icon-btn" title="Move left" @click="move(i, -1)">←</button>
            <button v-if="i < form.images.length - 1" type="button" class="admin-icon-btn" title="Move right" @click="move(i, 1)">→</button>
            <button type="button" class="admin-icon-btn !text-signal-500" title="Remove" @click="form.images.splice(i, 1)">✕</button>
          </div>
        </div>
      </div>

      <div class="mt-4 flex flex-wrap items-center gap-3">
        <label class="btn-ghost !px-4 !py-2 !text-xs cursor-pointer">
          {{ uploading ? 'Uploading…' : '⬆ Upload photos' }}
          <input type="file" accept="image/*" multiple class="hidden" :disabled="uploading" @change="upload">
        </label>
        <span class="text-xs text-bone-400">or</span>
        <input v-model.trim="imageUrl" type="url" class="input-dark !w-72 !py-2 text-xs" placeholder="https:// paste an image URL">
        <button type="button" class="btn-ghost !px-4 !py-2 !text-xs" :disabled="!imageUrl" @click="addUrl">Add URL</button>
      </div>
      <p v-if="uploadError" class="mt-2 text-xs text-signal-500">{{ uploadError }}</p>
    </section>

    <!-- Specs -->
    <section>
      <h2 class="text-sm font-heading font-semibold uppercase tracking-widest text-gold-500">Specs</h2>
      <p class="mt-1 text-xs text-bone-400">Leave anything that doesn't apply empty; empty rows are hidden on the site.</p>
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
          <label class="admin-label">Drivetrain</label>
          <select v-model="form.specs.drivetrain" class="input-dark">
            <option value="">—</option>
            <option value="4x4">4x4</option>
            <option value="2wd">2WD</option>
            <option value="6x6">6x6</option>
          </select>
        </div>
        <div>
          <label class="admin-label">Transmission</label>
          <select v-model="form.specs.transmission" class="input-dark">
            <option value="">—</option>
            <option value="automatic">Automatic</option>
            <option value="manual">Manual</option>
          </select>
        </div>
        <div>
          <label class="admin-label">Fuel</label>
          <select v-model="form.specs.fuel" class="input-dark">
            <option value="">—</option>
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
    <div class="border-t border-ink-800 pt-6">
      <div v-if="error" class="mb-5 border border-signal-500/50 bg-signal-500/10 p-4 text-sm">
        <p class="font-semibold text-signal-500">Could not save</p>
        <ul class="mt-1 text-bone-400 list-disc list-inside">
          <li v-for="(msg, i) in errorList" :key="i">{{ msg }}</li>
        </ul>
      </div>
      <div class="flex items-center gap-4">
        <button type="submit" class="btn-gold disabled:opacity-60" :disabled="saving">
          {{ saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create vehicle' }}
        </button>
        <NuxtLink to="/admin" class="btn-ghost !px-5 !py-2.5">Cancel</NuxtLink>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { Vehicle, VehicleCategory } from '~/types'

const props = defineProps<{
  /** Existing vehicle when editing; omit when creating */
  vehicle?: Vehicle
  saving?: boolean
  error?: string | string[]
}>()

const emit = defineEmits<{ save: [payload: Record<string, unknown>] }>()

const CATEGORIES: VehicleCategory[] = ['campers', 'equipment-cars', 'support-vehicles', 'trailers']
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
  category: v?.category ?? 'campers',
  featured: v?.featured ?? false,
  name: { en: v?.name.en ?? '', is: v?.name.is ?? '' },
  tagline: { en: v?.tagline.en ?? '', is: v?.tagline.is ?? '' },
  description: { en: v?.description.en ?? '', is: v?.description.is ?? '' },
  highlights: (v?.highlights ?? []).map(h => ({ en: h.en ?? '', is: h.is ?? '' })),
  images: [...(v?.images ?? [])],
  specs: {
    units: v?.specs.units ?? ('' as number | ''),
    seats: v?.specs.seats ?? ('' as number | ''),
    sleeps: v?.specs.sleeps ?? ('' as number | ''),
    lengthM: v?.specs.lengthM ?? ('' as number | ''),
    heightM: v?.specs.heightM ?? ('' as number | ''),
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
    featured: form.featured,
    name: form.name,
    tagline: form.tagline,
    description: form.description,
    highlights: form.highlights.filter(h => h.en || h.is),
    images: form.images,
    specs: {
      ...form.specs,
      units: form.specs.units || undefined,
      seats: form.specs.seats || undefined,
      sleeps: form.specs.sleeps || undefined,
      lengthM: form.specs.lengthM || undefined,
      heightM: form.specs.heightM || undefined,
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
  @apply w-7 h-7 flex items-center justify-center bg-ink-950/80 text-bone-100 text-xs
    hover:text-gold-400 transition-colors;
}
</style>
