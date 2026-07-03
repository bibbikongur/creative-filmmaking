import { vehicles } from '~~/app/data/vehicles'

// Feed vehicle detail URLs to @nuxtjs/seo's sitemap module. The i18n
// integration expands each into its per-locale variant with hreflang links.
export default defineSitemapEventHandler(() =>
  vehicles.map(v => ({
    loc: `/vehicles/${v.slug}`,
    _i18nTransform: true,
  })),
)
