// Google Analytics 4 with Consent Mode v2 — loaded only when
// NUXT_PUBLIC_GA_ID is set and not in dev, so local work never pollutes the
// stats. Consent defaults to denied (cookieless pings only) until the visitor
// accepts via the CookieConsent banner; the choice persists in localStorage.
// GA4's enhanced measurement (on by default) tracks SPA route changes via the
// History API, so a plain gtag bootstrap is all that's needed.
export const CONSENT_KEY = 'cf-analytics-consent'

export default defineNuxtPlugin(() => {
  const gaId = useRuntimeConfig().public.gaId

  const w = window as typeof window & { dataLayer?: unknown[] }
  w.dataLayer = w.dataLayer || []
  // gtag.js requires the literal `arguments` object — a spread array won't work.
  function gtag(..._args: unknown[]) {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer!.push(arguments)
  }

  // Persist + apply the banner's verdict. Provided even when GA is off so the
  // banner component never has to care whether analytics is configured.
  const setConsent = (granted: boolean) => {
    try {
      localStorage.setItem(CONSENT_KEY, granted ? 'granted' : 'denied')
    }
    catch { /* private mode — the choice just won't persist */ }
    gtag('consent', 'update', { analytics_storage: granted ? 'granted' : 'denied' })
  }

  if (!gaId || import.meta.dev) {
    return { provide: { gaConsent: setConsent } }
  }

  let stored: string | null = null
  try {
    stored = localStorage.getItem(CONSENT_KEY)
  }
  catch { /* ignore */ }

  // Consent Mode v2 default MUST be set before the config call.
  gtag('consent', 'default', {
    analytics_storage: stored === 'granted' ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  })
  gtag('js', new Date())
  gtag('config', gaId)

  useHead({
    script: [{ src: `https://www.googletagmanager.com/gtag/js?id=${gaId}`, async: true }],
  })

  return { provide: { gaConsent: setConsent } }
})
