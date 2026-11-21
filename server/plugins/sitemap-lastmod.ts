import { createHash } from 'node:crypto'
import isMessages from '~~/i18n/locales/is.json'
import enMessages from '~~/i18n/locales/en.json'

// The sitemap entries that are not rows in the database (home, the two hubs,
// about, contact and the vehicle type pages) need two things the sitemap
// module does not give them:
//
// 1. A truthful lastmod. Database pages bring their own (the row's
//    updated_at). The static ones get the moment their copy last changed: a
//    hash of the locale files is kept in the `meta` table together with a
//    date, and the date only moves when the hash does. So a deploy that
//    changes nothing does not tell Google that every page was modified.
//    (Until the database has a stamp, the build-time value from nuxt.config
//    is used.)
//
// 2. x-default pointing at the English page. A searcher whose language is
//    neither Icelandic nor English is better served by the English version.
const KEY = 'sitemap:static'

function staticLastmod(fallback: string): string {
  try {
    const hash = createHash('sha1').update(JSON.stringify([isMessages, enMessages])).digest('hex')
    const db = getDb()
    const row = db.prepare('SELECT value FROM meta WHERE key = ?').get(KEY) as { value: string } | undefined
    const stored = row ? JSON.parse(row.value) as { hash: string, lastmod: string } : undefined
    if (stored?.hash === hash) return stored.lastmod
    const lastmod = new Date().toISOString()
    db.prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
      .run(KEY, JSON.stringify({ hash, lastmod }))
    return lastmod
  }
  catch {
    return fallback
  }
}

type SitemapUrl = { loc?: string, lastmod?: string | Date, alternatives?: { hreflang: string, href: string }[] }

export default defineNitroPlugin((nitro) => {
  let lastmod: string | undefined
  nitro.hooks.hook('sitemap:resolved', (ctx) => {
    lastmod ??= staticLastmod(useRuntimeConfig().sitemapLastmod || new Date().toISOString())
    for (const url of ctx.urls as SitemapUrl[]) {
      url.lastmod ??= lastmod
      const english = url.alternatives?.find(a => a.hreflang === 'en-GB')
      const fallback = url.alternatives?.find(a => a.hreflang === 'x-default')
      if (english && fallback) fallback.href = english.href
    }
  })
})
