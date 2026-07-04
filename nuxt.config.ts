// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-07-03',
  devtools: { enabled: process.env.NODE_ENV !== 'production' },

  modules: [
    '@nuxt/fonts',
    '@nuxtjs/tailwindcss',
    '@nuxt/image',
    // Bilingual (English default + Icelandic). Registered before @nuxtjs/seo so the
    // SEO bundle picks it up and emits hreflang + per-locale canonical/sitemap.
    '@nuxtjs/i18n',
    // All-in-one SEO: sitemap, robots, schema.org, canonical & meta defaults.
    '@nuxtjs/seo',
  ],

  i18n: {
    // English is the default locale at the root (/, /vehicles/x) — international
    // film productions scouting Iceland are the primary audience. Icelandic
    // lives under /is/*.
    strategy: 'prefix_except_default',
    defaultLocale: 'en',
    vueI18n: 'i18n.config.ts',
    locales: [
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
      { code: 'is', language: 'is-IS', name: 'Íslenska', file: 'is.json' },
    ],
    lazy: true,
    baseUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://creativefilmmaking.is',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_locale',
      redirectOn: 'root',
    },
  },

  // Canonical site identity — powers absolute URLs in canonical links, OG tags & sitemap.
  // Override per-environment with NUXT_PUBLIC_SITE_URL (e.g. the Railway domain).
  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'https://creativefilmmaking.is',
    name: 'Creative Filmmaking',
    defaultLocale: 'en',
  },

  app: {
    head: {
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },

  // Vehicle detail URLs come from the fleet store via a tiny server route.
  sitemap: {
    sources: ['/api/__sitemap__/urls'],
    exclude: ['/admin', '/admin/**', '/is/admin', '/is/admin/**'],
  },

  // The admin panel is a client-side app behind a login — no SSR, no indexing.
  routeRules: {
    '/admin': { ssr: false, robots: false },
    '/admin/**': { ssr: false, robots: false },
    '/is/admin': { ssr: false, robots: false },
    '/is/admin/**': { ssr: false, robots: false },
  },

  // Dynamic OG-image generation needs a heavy native renderer; we set explicit
  // og:image meta tags instead (vehicle photo on detail pages).
  ogImage: {
    enabled: false,
  },


  image: {
    // Unsplash hosts the placeholder fleet imagery; swap for /images/* files
    // (no domain entry needed) when real photos arrive.
    domains: ['images.unsplash.com'],
    // Register the pass-through provider — imgProvider() routes admin-uploaded
    // /uploads/* photos here (they live outside public/, so IPX can't see them).
    // Without this key the provider isn't bundled and SSR throws "Unknown provider".
    none: {},
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
    contactTo: '',
    // Password for /admin (NUXT_ADMIN_PASSWORD). Unset = admin panel disabled.
    adminPassword: '',
    // Where vehicles.json + uploaded photos live (NUXT_DATA_DIR). Defaults to
    // ./.data — point it at a persistent volume in production (e.g. /data).
    dataDir: '',
    public: {
      // Absolute origin for links in server-sent emails (quote notifications,
      // offers). Same source as site.url; NUXT_PUBLIC_SITE_URL overrides.
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://creativefilmmaking.is',
      // Business contact details — single source of truth for the footer and
      // contact page. Override per-environment with the matching NUXT_PUBLIC_* var.
      contact: {
        address: process.env.NUXT_PUBLIC_CONTACT_ADDRESS || 'Reykjavík, Iceland',
        phone: process.env.NUXT_PUBLIC_CONTACT_PHONE || '+354 772 4968',
        email: process.env.NUXT_PUBLIC_CONTACT_EMAIL || 'info@creativefilmmaking.is',
      },
    },
  },
})
