/**
 * For a page whose last URL segment differs per language (vehicle and
 * equipment items, equipment categories): registers both segments with
 * @nuxtjs/i18n, so the hreflang links and the language switcher point at the
 * translated address, and points hreflang x-default at the English page.
 *
 * The x-default override has to live here and not only in app.vue: the i18n
 * module re-emits the alternates for these pages after the params are set,
 * with x-default on the default (Icelandic) locale, and that later entry won.
 * The sitemap already says x-default = English for every page.
 */
export function useLocalisedSlugs(slugs: { is: string, en: string }) {
  useSetI18nParams()({ is: { slug: slugs.is }, en: { slug: slugs.en } })

  // Read after the params are set, so the English href carries the translated segment.
  const head = useLocaleHead()
  useHead(() => {
    const english = head.value.link?.find(l => l.hreflang === 'en')
    return english?.href
      ? { link: [{ id: 'i18n-xd', rel: 'alternate', hreflang: 'x-default', href: english.href }] }
      : {}
  })
}
