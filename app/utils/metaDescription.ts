const SENTENCE_BREAK = /(?<=[.!?])\s+(?=[A-ZÁÐÉÍÓÚÝÞÆÖ0-9„“"(])/

/**
 * Build a meta description out of whole sentences. Takes the texts in order
 * of importance (the keyword lead, the tagline, the first paragraph) and adds
 * sentence after sentence while the result stays inside Google's ~160
 * characters, so the snippet never stops mid-sentence. Only when even the
 * first sentence is too long is it cut at a word break with an ellipsis.
 */
export function composeMetaDescription(parts: (string | undefined)[], max = 160): string {
  const sentences = parts
    .filter((p): p is string => Boolean(p && p.trim()))
    .flatMap(p => p.replace(/\s+/g, ' ').trim().split(SENTENCE_BREAK))
    .map(s => s.trim())
    .filter(Boolean)
  let out = ''
  for (const s of sentences) {
    // The same thing said twice (a description that echoes its tagline) is skipped.
    if (out.includes(s)) continue
    const next = out ? `${out} ${s}` : s
    if (next.length > max) break
    out = next
  }
  return out || trimMetaDescription(sentences[0] ?? '', max)
}

// Trim a meta description to Google's ~160-character snippet window. Ends on
// a whole sentence when it can; otherwise cuts at the last word break so the
// snippet never ends mid-word ("bílljósu…"), and drops trailing punctuation
// before the ellipsis.
export function trimMetaDescription(text: string, max = 160): string {
  if (text.length <= max) return text
  // A whole sentence reads better in a search result than one cut off with an
  // ellipsis: end on the last full stop inside the window when that still
  // leaves a useful snippet. (A full stop only counts when a capital letter or
  // a digit follows, so "klst. á" and "t.d. í" are not taken for sentence ends.)
  const window = text.slice(0, max + 3)
  const ends = [...window.matchAll(/[.!?](?=\s+[A-ZÁÐÉÍÓÚÝÞÆÖ0-9„“"(])/g)].map(m => m.index! + 1)
  const lastEnd = ends.filter(i => i >= 100 && i <= max).pop()
  if (lastEnd) return text.slice(0, lastEnd)
  const cut = text.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  const head = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut
  return `${head.replace(/[\s.,;:–-]+$/, '')}…`
}
