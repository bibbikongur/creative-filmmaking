import type { LocalizedText } from '~/types'

// Resolve a per-locale text object ({ en, is }) to the current locale,
// falling back to English so untranslated content never renders empty.
export const useLocalized = () => {
  const { locale } = useI18n()

  const lt = (text: LocalizedText | undefined): string => {
    if (!text) return ''
    return text[locale.value as keyof LocalizedText] || text.en
  }

  return { lt }
}
