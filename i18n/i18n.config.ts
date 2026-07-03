// Vue I18n runtime config. Missing Icelandic keys fall back to English so the
// site never renders a raw key, even before every string is translated.
export default defineI18nConfig(() => ({
  legacy: false,
  fallbackLocale: 'en',
}))
