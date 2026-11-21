// Vue I18n runtime config. Missing Icelandic keys fall back to English so the
// site never renders a raw key, even before every string is translated.
export default defineI18nConfig(() => ({
  legacy: false,
  fallbackLocale: 'en',
  // Icelandic: a noun after a number ending in 1 (but not 11) is singular:
  // "1 vara", "21 vara", "61 vara", but "11 vörur". Strings with a single
  // form are left alone.
  pluralRules: {
    is: (n: number, forms: number) => (forms < 2 ? 0 : (n % 10 === 1 && n % 100 !== 11 ? 0 : 1)),
  },
}))
