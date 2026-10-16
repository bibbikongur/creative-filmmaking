<template>
  <div class="flex items-center text-xs font-semibold uppercase tracking-wider" role="group" :aria-label="t('common.language')">
    <button
      v-for="(l, i) in options"
      :key="l.code"
      type="button"
      class="px-2.5 py-2 transition-colors"
      :class="[
        l.code === locale ? 'text-gold-400' : 'text-bone-400 hover:text-bone-100',
        i > 0 ? 'border-l border-ink-700' : '',
      ]"
      :aria-pressed="l.code === locale"
      :aria-label="t(l.name)"
      @click="choose(l.code)"
    >
      {{ l.short }}
    </button>
  </div>
</template>

<script setup lang="ts">
const { t, locale, setLocale } = useI18n()

// Icelandic first: it is the default locale and the primary audience.
const options = [
  { code: 'is' as const, short: 'IS', name: 'common.icelandic' },
  { code: 'en' as const, short: 'EN', name: 'common.english' },
]

// setLocale switches the locale, navigates to the equivalent localized route
// and persists the choice via the i18n cookie (cookieKey in nuxt.config).
const choose = async (code: 'en' | 'is') => {
  if (code === locale.value) return
  await setLocale(code)
}
</script>
