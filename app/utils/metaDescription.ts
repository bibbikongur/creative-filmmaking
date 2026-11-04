// Trim a meta description to Google's ~160-character snippet window. Cuts at
// the last word break so the snippet never ends mid-word ("bílljósu…"), and
// drops trailing punctuation before the ellipsis.
export function trimMetaDescription(text: string, max = 160): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  const head = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut
  return `${head.replace(/[\s.,;:–-]+$/, '')}…`
}
