// Google Analytics 4 — loaded only when NUXT_PUBLIC_GA_ID is set and not in
// dev, so local work never pollutes the stats. GA4's enhanced measurement
// (on by default) tracks SPA route changes via the History API, so a plain
// gtag bootstrap is all that's needed.
export default defineNuxtPlugin(() => {
  const gaId = useRuntimeConfig().public.gaId
  if (!gaId || import.meta.dev) return

  useHead({
    script: [{ src: `https://www.googletagmanager.com/gtag/js?id=${gaId}`, async: true }],
  })

  const w = window as typeof window & { dataLayer?: unknown[] }
  w.dataLayer = w.dataLayer || []
  // gtag.js requires the literal `arguments` object — a spread array won't work.
  function gtag(..._args: unknown[]) {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer!.push(arguments)
  }
  gtag('js', new Date())
  gtag('config', gaId)
})
