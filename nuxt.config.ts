// Seed-catalogue vehicles that were live on the site July–August 2026 and then
// removed from the catalogue. Google still holds their URLs; 301 them to the
// fleet page so old links and index entries land somewhere useful.
const REMOVED_VEHICLE_SLUGS = [
  'arctic-base-4x4-camper',
  'highland-crew-camper',
  'production-crew-truck',
  'crew-shuttle-minibus',
  'land-cruiser-location-scout',
  'camera-support-defender',
  'talent-trailer',
  'makeup-costume-trailer',
  'generator-equipment-trailer',
  'chevrolet-silverado-ltz',
]
const removedVehicleRedirects = Object.fromEntries(REMOVED_VEHICLE_SLUGS.flatMap(slug => [
  [`/vehicles/${slug}`, { redirect: { to: '/vehicles', statusCode: 301 } }],
  [`/en/vehicles/${slug}`, { redirect: { to: '/en/vehicles', statusCode: 301 } }],
]))

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-07-03',
  devtools: { enabled: process.env.NODE_ENV !== 'production' },

  modules: [
    '@nuxt/fonts',
    '@nuxtjs/tailwindcss',
    '@nuxt/image',
    // Bilingual (Icelandic default + English). Registered before @nuxtjs/seo so the
    // SEO bundle picks it up and emits hreflang + per-locale canonical/sitemap.
    '@nuxtjs/i18n',
    // All-in-one SEO: sitemap, robots, schema.org, canonical & meta defaults.
    '@nuxtjs/seo',
  ],

  i18n: {
    // Icelandic is the default locale at the root (/, /vehicles/x) — the local
    // market is the primary audience. English lives under /en/* for international
    // film productions scouting Iceland.
    strategy: 'prefix_except_default',
    defaultLocale: 'is',
    vueI18n: 'i18n.config.ts',
    locales: [
      { code: 'is', language: 'is-IS', name: 'Íslenska', file: 'is.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
    ],
    baseUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://creativefilmmaking.is',
    // No browser-language redirect: everyone lands on the Icelandic root page.
    // English is opt-in via the language switcher (/en/*).
    detectBrowserLanguage: false,
  },

  // Canonical site identity — powers absolute URLs in canonical links, OG tags & sitemap.
  // Override per-environment with NUXT_PUBLIC_SITE_URL (e.g. the Railway domain).
  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'https://creativefilmmaking.is',
    name: 'Creative Filmmaking',
    defaultLocale: 'is',
  },

  app: {
    // Short cross-fade between routes (classes in assets/css/tailwind.css).
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
      meta: [
        { name: 'theme-color', content: '#0E1318' },
        // Google Search Console ownership proof — set NUXT_PUBLIC_GOOGLE_SITE_VERIFICATION
        // on Railway to the content= token GSC hands out, redeploy, done.
        ...(process.env.NUXT_PUBLIC_GOOGLE_SITE_VERIFICATION
          ? [{ name: 'google-site-verification', content: process.env.NUXT_PUBLIC_GOOGLE_SITE_VERIFICATION }]
          : []),
      ],
    },
  },

  // Vehicle detail URLs come from the fleet store via a tiny server route.
  sitemap: {
    sources: ['/api/__sitemap__/urls'],
    exclude: [
      '/admin', '/admin/**', '/en/admin', '/en/admin/**',
      '/portal', '/portal/**', '/en/portal', '/en/portal/**',
      // The quote basket is noindexed in-page; keep it out of the sitemap too.
      '/cart', '/en/cart',
    ],
  },

  seo: {
    // The seo-utils default whitelist keeps ?category= (and others) in the
    // canonical URL, which made the old filtered listings index as duplicates.
    // Category views are real pages now (/vehicles/kassabilar …), so only
    // pagination may ever vary a canonical.
    canonicalQueryWhitelist: ['page'],
  },

  // The admin panel and timesheet portal are client-side apps behind a login —
  // no SSR, no indexing.
  routeRules: {
    // The tipping trailer's original admin slug was "trailer"; it now lives on
    // a keyword slug ("kerra til leigu" searches). 301 keeps old links alive.
    '/vehicles/trailer': { redirect: { to: '/vehicles/kerra-med-sturtu', statusCode: 301 } },
    '/en/vehicles/trailer': { redirect: { to: '/en/vehicles/kerra-med-sturtu', statusCode: 301 } },
    ...removedVehicleRedirects,
    '/cart': { robots: false },
    '/en/cart': { robots: false },
    '/admin': { ssr: false, robots: false },
    '/admin/**': { ssr: false, robots: false },
    '/en/admin': { ssr: false, robots: false },
    '/en/admin/**': { ssr: false, robots: false },
    '/portal': { ssr: false, robots: false },
    '/portal/**': { ssr: false, robots: false },
    '/en/portal': { ssr: false, robots: false },
    '/en/portal/**': { ssr: false, robots: false },
  },

  // Pre-bundle Leaflet at dev-server start so the location-map editor's dynamic
  // import never hits a stale Vite optimize-deps cache (504 Outdated Optimize Dep).
  vite: {
    optimizeDeps: {
      include: ['leaflet', 'leaflet-path-drag'],
    },
  },

  // Dynamic OG-image generation needs a heavy native renderer; we set explicit
  // og:image meta tags instead (vehicle photo on detail pages).
  ogImage: {
    enabled: false,
  },


  image: {
    quality: 80,
    // Seeded /images/* photos go through IPX; its default is a 60-second
    // cache. The files never change under a given name, so cache them like
    // /uploads/* variants: a year, immutable.
    ipx: { maxAge: 31536000 },
    // Custom provider for admin-uploaded /uploads/* photos — imgProvider()
    // routes them here (they live outside public/, so IPX can't see them).
    // The provider builds resize URLs handled by server/routes/uploads/.
    // Without this key the provider isn't bundled and SSR throws "Unknown provider".
    providers: {
      uploads: { provider: '~/providers/uploads' },
    },
  },

  fonts: {
    families: [
      { name: 'Inter', provider: 'google', weights: [400, 500, 600] },
      { name: 'Oswald', provider: 'google', weights: [500, 600, 700] },
    ],
  },

  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
    configPath: 'tailwind.config',
    exposeConfig: false,
    config: {},
    viewer: true,
  },

  runtimeConfig: {
    // Private (server-only) — SMTP for the offer-request form. Set on Railway:
    // NUXT_SMTP_HOST, NUXT_SMTP_PORT, NUXT_SMTP_USER, NUXT_SMTP_PASS, NUXT_CONTACT_TO.
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPass: '',
    // From address for outgoing mail (NUXT_MAIL_FROM). Needed when the SMTP
    // username isn't a mailbox (e.g. Resend uses the literal user "resend").
    mailFrom: '',
    contactTo: '',
    // Password for /admin (NUXT_ADMIN_PASSWORD). Unset = admin panel disabled.
    adminPassword: '',
    // Seals the timesheet-portal session cookie (NUXT_SESSION_SECRET).
    // Use 32+ random characters; rotating it logs every portal user out.
    sessionSecret: '',
    // AES-256-GCM key for encrypted columns like day rates (NUXT_ENCRYPTION_KEY).
    // Keep a copy in a password manager — losing it makes those values unrecoverable.
    encryptionKey: '',
    // Where vehicles.json + uploaded photos live (NUXT_DATA_DIR). Defaults to
    // ./.data — point it at a persistent volume in production (e.g. /data).
    dataDir: '',
    public: {
      // Absolute origin for links in server-sent emails (quote notifications,
      // offers). Same source as site.url; NUXT_PUBLIC_SITE_URL overrides.
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://creativefilmmaking.is',
      // Google Analytics 4 measurement id (NUXT_PUBLIC_GA_ID, e.g. G-XXXXXXXXXX).
      // Unset = no analytics script is loaded at all.
      gaId: process.env.NUXT_PUBLIC_GA_ID || '',
      // Business contact details — single source of truth for the footer and
      // contact page. Override per-environment with the matching NUXT_PUBLIC_* var.
      contact: {
        address: process.env.NUXT_PUBLIC_CONTACT_ADDRESS || 'Grensásvegur 1, 108 Reykjavík',
        phone: process.env.NUXT_PUBLIC_CONTACT_PHONE || '+354 772 4968',
        email: process.env.NUXT_PUBLIC_CONTACT_EMAIL || 'info@creativefilmmaking.is',
        // Pin for the schema.org geo block and the contact-page map (Grensásvegur 1).
        lat: 64.1353,
        lng: -21.8689,
      },
      // Social profile URLs (NUXT_PUBLIC_SOCIAL_*). Each one that is set is
      // emitted as a schema.org sameAs link, which is how Google ties the site
      // to the Business Profile and social accounts. Empty = omitted.
      social: {
        facebook: process.env.NUXT_PUBLIC_SOCIAL_FACEBOOK || '',
        instagram: process.env.NUXT_PUBLIC_SOCIAL_INSTAGRAM || '',
        linkedin: process.env.NUXT_PUBLIC_SOCIAL_LINKEDIN || '',
        youtube: process.env.NUXT_PUBLIC_SOCIAL_YOUTUBE || '',
      },
    },
  },
})
