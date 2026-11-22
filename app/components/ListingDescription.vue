<template>
  <!-- The long copy of a listing. On a phone it shows its opening and folds the rest
       behind "Read more" (the page is long there, and the points above have said the
       essentials); the whole text is always in the HTML. -->
  <section :aria-labelledby="headingId">
    <h2 :id="headingId" class="h3">{{ t('listing.aboutTitle') }}</h2>
    <!-- pre-line: a paragraph may be a short list of "label: value" lines -->
    <div
      :id="bodyId"
      class="mt-5 max-w-[68ch] space-y-4 text-bone-100/85 leading-relaxed whitespace-pre-line"
      :class="foldable && !open ? 'max-sm:line-clamp-[7]' : ''"
    >
      <p v-for="(paragraph, i) in paragraphs" :key="i">{{ keepUnits(paragraph) }}</p>
    </div>
    <button
      v-if="foldable"
      type="button"
      class="sm:hidden mt-2 inline-flex items-center gap-2 min-h-[2.75rem] text-sm font-medium text-bone-100 underline decoration-ink-500 underline-offset-4"
      :aria-expanded="open"
      :aria-controls="bodyId"
      @click="open = !open"
    >
      {{ open ? t('equipmentCatalogue.browser.readLess') : t('equipmentCatalogue.browser.readMore') }}
    </button>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{ paragraphs: string[] }>()

const { t } = useI18n()
const headingId = useId()
const bodyId = useId()
const open = ref(false)
// Short copy is shown whole: folding three lines away saves nothing.
const foldable = computed(() => props.paragraphs.join(' ').length > 420)
</script>
