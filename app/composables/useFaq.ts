export interface FaqItem {
  q: string
  a: string
}

/**
 * Reads a question/answer list from the locale files.
 *
 * FAQs are stored as arrays of `{ q, a }` objects (e.g. `faq.home`). They are
 * read item by item through t() with an index path (`faq.home.0.q`), which
 * works the same for precompiled and lazily loaded messages; te()/tm() are
 * unreliable for array messages across vue-i18n modes. A missing key returns
 * the key itself, which ends the loop, so an absent FAQ yields an empty list
 * and the section simply doesn't render.
 */
export const useFaq = () => {
  const { t } = useI18n()

  const faq = (key: string): FaqItem[] => {
    const out: FaqItem[] = []
    for (let i = 0; i < 40; i++) {
      const qKey = `${key}.${i}.q`
      const aKey = `${key}.${i}.a`
      const q = t(qKey)
      const a = t(aKey)
      if (!q || !a || q === qKey || a === aKey) break
      out.push({ q, a })
    }
    return out
  }

  return { faq }
}
