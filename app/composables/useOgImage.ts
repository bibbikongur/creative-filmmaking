// Absolute URL of a 1200×630 JPEG share image for a catalogue photo.
//
// app.vue declares og:image:width/height as 1200×630 site-wide; detail pages
// used to override og:image with the raw upload (often a multi-MB original in
// a different aspect), so the declared dimensions were a lie. This builds a
// real 1200×630 crop through whichever resizer serves the source: IPX for
// seeded /images/* files, the uploads route for admin photos.
//
// `contain` pads with white instead of cropping, for product shots on a plain
// background (equipment); `cover` fills the frame (vehicles).
export const useOgImage = () => {
  const img = useImage()
  const siteUrl = useRuntimeConfig().public.siteUrl

  const ogImageUrl = (src: string | undefined, fit: 'cover' | 'contain' = 'cover'): string | undefined => {
    if (!src) return undefined
    if (src.startsWith('http')) return src
    // @nuxt/image types the provider option from its built-in list only; the
    // custom "uploads" provider is registered in nuxt.config and valid at runtime.
    const provider = imgProvider(src) as Parameters<typeof img>[2] extends { provider?: infer P } ? P : never
    const url = img(src, { width: 1200, height: 630, format: 'jpeg', quality: 80, fit }, { provider })
    return url.startsWith('http') ? url : `${siteUrl}${url}`
  }

  return { ogImageUrl }
}
