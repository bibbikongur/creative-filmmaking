<template>
  <!-- Real links, not buttons: the other language's version of the page is one
       click away for people and one <a href> away for crawlers. On pages whose
       URL segment differs per language (items, categories, landings) the link
       carries the translated segment the page registered with the i18n module. -->
  <nav class="flex items-center text-xs font-semibold uppercase tracking-wider" :aria-label="t('common.language')">
    <SwitchLocalePathLink
      v-for="(l, i) in options"
      :key="l.code"
      :locale="l.code"
      :hreflang="l.code"
      :lang="l.code"
      class="px-2.5 py-2 transition-colors"
      :class="[
        l.code === locale ? 'text-gold-400' : 'text-bone-400 hover:text-bone-100',
        i > 0 ? 'border-l border-ink-700' : '',
      ]"
      :aria-current="l.code === locale ? 'true' : undefined"
      :aria-label="t(l.name)"
    >
      {{ l.short }}
    </SwitchLocalePathLink>
  </nav>
</template>

<script setup lang="ts">
const { t, locale } = useI18n()

// Icelandic first: it is the default locale and the primary audience.
const options = [
  { code: 'is' as const, short: 'IS', name: 'common.icelandic' },
  { code: 'en' as const, short: 'EN', name: 'common.english' },
]
</script>
