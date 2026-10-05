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
          <input v-model.trim="form.name.is" type="text" class="input-dark" @input="autoSlug">
        </div>
        <div>
          <label class="admin-label">URL slug</label>
          <input v-model.trim="form.slug" type="text" class="input-dark font-mono" placeholder="rafstod-2-2-kva" @input="slugTouched = true">
          <p class="mt-1 text-xs text-bone-400">
            Page address: /equipment/{{ form.slug || '…' }}
            <span v-if="isEdit" class="text-signal-500/80"> (changing it breaks links already shared).</span>
          </p>
        </div>
        <div>
          <label class="admin-label">Category *</label>
          <select v-model="form.category" class="input-dark">
            <option v-for="c in equipmentCategories" :key="c" :value="c">{{ c }}</option>
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
      <p class="mt-1 text-xs text-bone-400">The tagline is the short line on the card. The description is the detail page's body copy: what it is, what it is for, what comes with it. Icelandic is optional; the site falls back to English when empty.</p>
      <div class="mt-4 grid gap-5 sm:grid-cols-2">
        <div>
          <label class="admin-label">Tagline (English)</label>
          <textarea v-model.trim="form.tagline.en" rows="3" class="input-dark resize-y" />
        </div>
        <div>
          <label class="admin-label">Tagline (Icelandic)</label>
          <textarea v-model.trim="form.tagline.is" rows="3" class="input-dark resize-y" />
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
      <p class="mt-1 text-xs text-bone-400">3–5 short bullets shown on the detail page (what's included, output, runtime, licence).</p>
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
      <p class="mt-1 text-xs text-bone-400">The first photo is the card image. Use the arrows to reorder.</p>

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
          {{ saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create item' }}
        </button>
        <NuxtLink to="/admin/equipment" class="btn-ghost !px-5 !py-2.5">Cancel</NuxtLink>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import { equipmentCategories } from '~/data/equipmentCategories'
import type { EquipmentItem } from '~/types'

const props = defineProps<{
  /** Existing item when editing; omit when creating */
  item?: EquipmentItem
  saving?: boolean
  error?: string | string[]
}>()

const emit = defineEmits<{ save: [payload: Record<string, unknown>] }>()

const isEdit = computed(() => Boolean(props.item))

const e = props.item
const form = reactive({
  // Existing rows without a stored slug show the derived one, so saving the
  // form pins the current URL instead of leaving it name-dependent.
  slug: e ? equipmentSlug(e) : '',
  category: e?.category ?? 'heating',
  featured: e?.featured ?? false,
  name: { en: e?.name.en ?? '', is: e?.name.is ?? '' },
  tagline: { en: e?.tagline.en ?? '', is: e?.tagline.is ?? '' },
  description: { en: e?.description?.en ?? '', is: e?.description?.is ?? '' },
  highlights: (e?.highlights ?? []).map(h => ({ en: h.en ?? '', is: h.is ?? '' })),
  images: [...(e?.images ?? [])],
})
if (!form.highlights.length) form.highlights.push({ en: '', is: '' })

// ── Slug auto-fill (new items only, until the user edits it by hand) ────────
const slugTouched = ref(isEdit.value)
const autoSlug = () => {
  if (!slugTouched.value) form.slug = slugify(form.name.is || form.name.en)
}

// ── Photos ───────────────────────────────────────────────────────────────────
const uploading = ref(false)
const uploadError = ref('')
const imageUrl = ref('')

const upload = async (ev: Event) => {
  const input = ev.target as HTMLInputElement
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
