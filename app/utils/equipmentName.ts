/**
 * "Olíuhitablásari 21 kW (Master BV 77 E)" → the name, and the bracketed model
 * or pack size as a separate detail, so names stay short in narrow places
 * (catalogue cards, list rows, the quote list).
 */
export const splitEquipmentName = (full: string): { main: string, detail: string } => {
  const m = full.match(/^(.*\S)\s*\(([^()]+)\)$/)
  return m ? { main: m[1]!, detail: m[2]! } : { main: full, detail: '' }
}

/** "21 kW" and "20 m" never split across lines: number and unit stay together. */
export const keepUnits = (text: string): string =>
  text.replace(/(\d)\s+(?=(kVA|kW|kg|km|cm|mm|lm|stk|amp|[mlVAWt])\b)/gi, '$1\u00A0')

// Second elements of the compounds that show up in equipment names. A long
// Icelandic compound may only break at the joint in front of one of these
// ("framlengingar-snúra", "umferðar-keilur"), never inside an element.
const TAILS = [
  'snúr', 'keil', 'blásar', 'hitar', 'stöð', 'tafl', 'töfl', 'kefl', 'tengi', 'borð', 'stól', 'tjald', 'tjöld',
  'skilt', 'vest', 'ljós', 'kastar', 'brús', 'breiðsl', 'borð', 'hjálm', 'spegil', 'spegl', 'skófl', 'dæl',
  'tæki', 'tækj', 'haus', 'staur', 'stöng', 'stang', 'búnað', 'pakk', 'tökur', 'kass', 'kerr', 'dún', 'varn',
]

/**
 * Soft hyphens for long compounds. Browsers ship no Icelandic hyphenation
 * dictionary, so `hyphens: auto` does nothing; without help a long word in a
 * narrow card is chopped mid-word. Only compound joints get a break point; a
 * word with no known joint simply wraps whole.
 */
export const softHyphenate = (text: string): string =>
  text.replace(/\p{L}{12,}/gu, (word) => {
    const lower = word.toLowerCase()
    let out = ''
    for (let i = 0; i < word.length; i++) {
      if (i >= 4 && word.length - i >= 4 && TAILS.some(tail => lower.startsWith(tail, i))) out += '\u00AD'
      out += word[i]
    }
    return out
  })
