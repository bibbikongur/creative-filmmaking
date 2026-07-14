// Feed vehicle detail URLs to @nuxtjs/seo's sitemap module. The i18n
// integration expands each into its per-locale variant with hreflang links.
// Reads the runtime store so admin-added vehicles appear too.
export default defineSitemapEventHandler(async () =>
  (await getVehicles()).map(v => ({
    loc: `/vehicles/${v.slug}`,
    _i18nTransform: true,
    // Google Images discovery — the module resolves relative paths against site.url.
    images: v.images.map(src => ({ loc: src })),
  })),
)
