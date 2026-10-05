import { defineProvider } from '@nuxt/image/runtime'

/**
 * Nuxt Image provider for admin-uploaded photos (/uploads/*).
 *
 * They live on the data volume outside public/, so IPX can't touch them.
 * Instead the serving route (server/routes/uploads/[...file].get.ts) resizes
 * with sharp via query params — this provider just builds those URLs, which
 * is what lets <NuxtImg sizes="..."> emit a real srcset for uploads.
 */
export default defineProvider({
  getImage: (src, { modifiers = {} }) => {
    const params = new URLSearchParams()
    if (modifiers.width) {
      params.set('w', String(Math.round(modifiers.width)))
      // Height + fit are only honoured by the route for the 1200×630 share
      // crop (see useOgImage); other sizes stay width-only.
      if (modifiers.height) {
        params.set('h', String(Math.round(modifiers.height)))
        if (modifiers.fit === 'contain') params.set('fit', 'contain')
      }
      // Default to webp; the route only transcodes to webp or jpeg.
      params.set('f', modifiers.format === 'jpeg' || modifiers.format === 'jpg' ? 'jpeg' : 'webp')
      if (modifiers.quality) params.set('q', String(modifiers.quality))
    }
    const qs = params.toString()
    return { url: qs ? `${src}?${qs}` : src }
  },
})
