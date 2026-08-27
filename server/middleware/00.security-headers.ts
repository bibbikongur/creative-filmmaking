// Security response headers for every route (pages + API alike). Runs before
// 00.site-lock (sorts first) so even the preview 401 carries them.
//
// The CSP allows inline scripts/styles because Nuxt injects inline hydration
// payload + critical CSS; without a nonce pipeline that can't be avoided. Dev
// additionally needs 'unsafe-eval' and websocket for HMR, so those are added
// only when import.meta.dev.
const isDev = import.meta.dev

const CSP = [
  `default-src 'self'`,
  `base-uri 'self'`,
  `object-src 'none'`,
  `frame-ancestors 'self'`,
  `form-action 'self'`,
  // The two extra hosts serve the location-map tool's map tiles (OSM streets,
  // Esri satellite) — both on screen and when the PDF exporter redraws them.
  `img-src 'self' data: blob: https://tile.openstreetmap.org https://server.arcgisonline.com`,
  `script-src 'self' 'unsafe-inline'${isDev ? ` 'unsafe-eval'` : ''}`,
  `style-src 'self' 'unsafe-inline'`,
  `font-src 'self' data:`,
  // OSRM serves the recce-plan tool's driving routes for the overview map.
  `connect-src 'self' https://router.project-osrm.org${isDev ? ' ws: wss:' : ''}`,
].join('; ')

export default defineEventHandler((event) => {
  setResponseHeaders(event, {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
    'Content-Security-Policy': CSP,
  })
  // HSTS only over real HTTPS (production); harmless-but-pointless on http dev.
  if (!isDev) {
    setResponseHeader(event, 'Strict-Transport-Security', 'max-age=63072000; includeSubDomains')
  }
})
