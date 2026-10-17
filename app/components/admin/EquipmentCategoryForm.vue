<template>
  <form class="space-y-10" @submit.prevent="submit">
    <!-- Name + address -->
    <section>
      <h2 class="text-sm font-heading font-semibold uppercase tracking-widest text-gold-500">Name and address</h2>
      <p class="mt-1 text-xs text-bone-400">
        The name is the short label on chips and card badges. The URL slug is the category page's address and is
        kept separate on purpose: renaming the category never moves the page. If you do change a slug, the old
        address keeps working and redirects to the new one.
      </p>
      <div class="mt-4 grid gap-5 sm:grid-cols-2">
        <div>
          <label class="admin-label">Name (Icelandic) *</label>
          <input v-model.trim="form.name.is" type="text" class="input-dark" @input="autoSlug('is')">
        </div>
        <div>
          <label class="admin-label">Name (English) *</label>
          <input v-model.trim="form.name.en" type="text" class="input-dark" @input="autoSlug('en')">
        </div>
        <div>
          <label class="admin-label">URL slug (Icelandic)</label>
          <input v-model.trim="form.slug.is" type="text" class="input-dark font-mono" placeholder="hitablasarar" @input="touched.is = true">
          <p class="mt-1 text-xs text-bone-400">/equipment/{{ form.slug.is || '…' }}</p>
        </div>
        <div>
          <label class="admin-label">URL slug (English)</label>
          <input v-model.trim="form.slug.en" type="text" class="input-dark font-mono" placeholder="heaters" @input="touched.en = true">
          <p class="mt-1 text-xs text-bone-400">/en/equipment/{{ form.slug.en || '…' }}</p>
        </div>
      </div>
      <p v-if="isEdit && slugChanged" class="mt-3 text-xs text-gold-400">
        The address is changing. The previous one will redirect here, so shared links and Google keep working.
      </p>
    </section>

    <!-- Landing page copy -->
    <section>
      <h2 class="text-sm font-heading font-semibold uppercase tracking-widest text-gold-500">Category page</h2>
      <p class="mt-1 text-xs text-bone-400">
        What the /equipment/&lt;slug&gt; page says. The title is the page heading, ideally the phrase people search for
        ("Hitablásarar til leigu"). The intro is the body copy; separate paragraphs with a blank line. Empty fields fall
        back to the name. The page stays out of Google until the category has at least one item.
      </p>
      <div class="mt-4 grid gap-5 sm:grid-cols-2">
        <div>
          <label class="admin-label">Page title (Icelandic)</label>
          <input v-model.trim="form.title.is" type="text" class="input-dark" placeholder="Hitablásarar til leigu">
        </div>
        <div>
          <label class="admin-label">Page title (English)</label>
          <input v-model.trim="form.title.en" type="text" class="input-dark" placeholder="Heaters for rent">
        </div>
        <div>
          <label class="admin-label">Intro (Icelandic)</label>
          <textarea v-model="form.intro.is" rows="7" class="input-dark resize-y" placeholder="Separate paragraphs with a blank line." />
        </div>
        <div>
          <label class="admin-label">Intro (English)</label>
          <textarea v-model="form.intro.en" rows="7" class="input-dark resize-y" />
        </div>
        <div>
          <label class="admin-label">Search result title (Icelandic)</label>
          <input v-model.trim="form.metaTitle.is" type="text" class="input-dark">
        </div>
        <div>
          <label class="admin-label">Search result title (English)</label>
          <input v-model.trim="form.metaTitle.en" type="text" class="input-dark">
        </div>
        <div>
          <label class="admin-label">Search result description (Icelandic)</label>
          <textarea v-model.trim="form.metaDescription.is" rows="3" class="input-dark resize-y" />
        </div>
        <div>
          <label class="admin-label">Search result description (English)</label>
          <textarea v-model.trim="form.metaDescription.en" rows="3" class="input-dark resize-y" />
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section>
      <h2 class="text-sm font-heading font-semibold uppercase tracking-widest text-gold-500">Questions and answers</h2>
      <p class="mt-1 text-xs text-bone-400">Shown at the bottom of the category page and marked up for search engines. Optional.</p>
      <div class="mt-4 space-y-5">
        <div v-for="(f, i) in form.faq" :key="i" class="border border-ink-800 p-4 space-y-3">
          <div class="grid gap-3 sm:grid-cols-2">
            <input v-model.trim="f.q.is" type="text" class="input-dark" placeholder="Question (Icelandic)">
            <input v-model.trim="f.q.en" type="text" class="input-dark" placeholder="Question (English)">
            <textarea v-model.trim="f.a.is" rows="3" class="input-dark resize-y" placeholder="Answer (Icelandic)" />
            <textarea v-model.trim="f.a.en" rows="3" class="input-dark resize-y" placeholder="Answer (English)" />
          </div>
          <button type="button" class="text-xs uppercase tracking-widest text-signal-500/80 hover:text-signal-500 transition-colors" @click="form.faq.splice(i, 1)">
            Remove question
          </button>
        </div>
      </div>
      <button type="button" class="btn-ghost !px-4 !py-2 !text-xs mt-3" @click="form.faq.push(emptyFaq())">
        + Add question
      </button>
    </section>

    <!-- Status -->
    <section v-if="isEdit">
      <h2 class="text-sm font-heading font-semibold uppercase tracking-widest text-gold-500">Status</h2>
      <label class="mt-3 flex items-start gap-2.5 text-sm text-bone-100 cursor-pointer">
        <input v-model="form.archived" type="checkbox" class="accent-gold-500 w-4 h-4 mt-0.5">
        <span>
          Archived: hidden from the site and the item form.
          <span class="block text-xs text-bone-400">Move its items to another category first. Categories are never deleted, so an archived one can be restored and its old address keeps redirecting.</span>
        </span>
      </label>
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
          {{ saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create category' }}
        </button>
        <NuxtLink to="/admin/equipment/categories" class="btn-ghost !px-5 !py-2.5">Cancel</NuxtLink>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { EquipmentCategoryDef } from '~/types'

const props = defineProps<{
  /** Existing category when editing; omit when creating */
  category?: EquipmentCategoryDef
  saving?: boolean
  error?: string | string[]
}>()

const emit = defineEmits<{ save: [payload: Record<string, unknown>] }>()

const isEdit = computed(() => Boolean(props.category))

const c = props.category
const emptyFaq = () => ({ q: { en: '', is: '' }, a: { en: '', is: '' } })
const joinParagraphs = (ps: { en: string, is: string }[] | undefined, code: 'en' | 'is') =>
  (ps ?? []).map(p => p[code]).filter(Boolean).join('\n\n')

const form = reactive({
  name: { en: c?.name.en ?? '', is: c?.name.is ?? '' },
  slug: { en: c?.slug.en ?? '', is: c?.slug.is ?? '' },
  title: { en: c?.title.en ?? '', is: c?.title.is ?? '' },
  metaTitle: { en: c?.metaTitle?.en ?? '', is: c?.metaTitle?.is ?? '' },
  metaDescription: { en: c?.metaDescription?.en ?? '', is: c?.metaDescription?.is ?? '' },
  intro: { en: joinParagraphs(c?.intro, 'en'), is: joinParagraphs(c?.intro, 'is') },
  faq: (c?.faq ?? []).map(f => ({ q: { en: f.q.en ?? '', is: f.q.is ?? '' }, a: { en: f.a.en ?? '', is: f.a.is ?? '' } })),
  archived: c?.status === 'archived',
})

// Slugs follow the names on a new category until edited by hand; on an
// existing one they never move on their own.
const touched = reactive({ is: isEdit.value, en: isEdit.value })
const autoSlug = (code: 'is' | 'en') => {
  if (!touched[code]) form.slug[code] = slugify(form.name[code])
}

const slugChanged = computed(() => !!c && (form.slug.is !== c.slug.is || form.slug.en !== c.slug.en))

const errorList = computed(() =>
  Array.isArray(props.error) ? props.error : props.error ? [props.error] : [],
)

const submit = () => {
  emit('save', {
    name: form.name,
    slug: form.slug,
    title: form.title,
    metaTitle: form.metaTitle,
    metaDescription: form.metaDescription,
    intro: form.intro,
    faq: form.faq.filter(f => (f.q.en && f.a.en) || (f.q.is && f.a.is)),
    status: form.archived ? 'archived' : 'active',
  })
}
</script>

<style scoped>
.admin-label {
  @apply block text-xs uppercase tracking-widest text-bone-400 mb-1.5;
}
</style>
