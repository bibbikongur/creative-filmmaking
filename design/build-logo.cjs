// Usage: node design/build-logo.cjs   (regenerates every logo/icon asset in public/ from the source PNG)
// Build the site logo assets from the supplied CF Rentals lockup (opaque white
// background, 1000×1000, lockup at x 94..904 / y 438..561).
//   public/logo-cf-rentals.png       transparent, as designed (dark text) — light backgrounds
//   public/logo-cf-rentals-dark.png  transparent, dark parts → bone-100 — the dark site chrome
//   public/logo-512.png              lockup centred on white (schema.org logo)
//   public/favicon.svg + favicon-32/apple-touch-icon/icon-192/icon-512 from a vector redraw of the mark
const path = require('node:path')
const fs = require('node:fs')
const sharp = require('sharp')

const SRC = process.argv[2] ?? path.join(__dirname, 'cf-rentals-logo-source.png')
const OUT = path.join(__dirname, '..', 'public')

const AMBER = [240, 168, 59]
const DARK = [20, 25, 30]
const BONE = [238, 241, 244] // bone-100 #EEF1F4
const INK = [14, 19, 24] // ink-950 #0E1318
const BOUNDS = { left: 94, top: 438, width: 811, height: 124 }
// Bolt cell (black rounded square with a white bolt) in source coordinates.
const BOLT = { x0: 181, y0: 525, x1: 217, y1: 561, r: 4 }

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
const WHITE = [255, 255, 255]
const D_AMBER = dist(AMBER, WHITE)
const D_DARK = dist(DARK, WHITE)

const inRoundedRect = (x, y, { x0, y0, x1, y1, r }) => {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false
  const cx = x < x0 + r ? x0 + r : x > x1 - r ? x1 - r : x
  const cy = y < y0 + r ? y0 + r : y > y1 - r ? y1 - r : y
  return Math.hypot(x - cx, y - cy) <= r + 0.5
}

async function buildLockups() {
  const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const W = info.width
  const { left, top, width, height } = BOUNDS
  const light = Buffer.alloc(width * height * 4)
  const dark = Buffer.alloc(width * height * 4)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sx = left + x, sy = top + y
      const i = (sy * W + sx) * 4
      const px = [data[i], data[i + 1], data[i + 2]]
      const o = (y * width + x) * 4

      if (inRoundedRect(sx, sy, BOLT)) {
        // Opaque cell: keep as designed on light; invert (dark→bone, white→ink) on dark.
        light.set([...px, 255], o)
        const t = (0.2126 * px[0] + 0.7152 * px[1] + 0.0722 * px[2]) / 255
        dark.set([
          Math.round(BONE[0] * (1 - t) + INK[0] * t),
          Math.round(BONE[1] * (1 - t) + INK[1] * t),
          Math.round(BONE[2] * (1 - t) + INK[2] * t),
          255,
        ], o)
        continue
      }

      const isAmber = px[0] - px[2] > 40
      const ink = isAmber ? AMBER : DARK
      const a = Math.max(0, Math.min(1, dist(px, WHITE) / (isAmber ? D_AMBER : D_DARK)))
      const alpha = Math.round(a * 255)
      light.set([...ink, alpha], o)
      dark.set([...(isAmber ? AMBER : BONE), alpha], o)
    }
  }

  const raw = { raw: { width, height, channels: 4 } }
  await sharp(light, raw).png({ compressionLevel: 9 }).toFile(path.join(OUT, 'logo-cf-rentals.png'))
  await sharp(dark, raw).png({ compressionLevel: 9 }).toFile(path.join(OUT, 'logo-cf-rentals-dark.png'))

  // Square schema.org logo on white.
  const lockup = await sharp(light, raw).resize({ width: 440 }).png().toBuffer()
  await sharp({ create: { width: 512, height: 512, channels: 4, background: '#ffffff' } })
    .composite([{ input: lockup, gravity: 'centre' }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT, 'logo-512.png'))
}

// Vector redraw of the mark: 3×3 grid, cell 14, gap 3 → 48 wide, centred in 64.
function faviconSvg() {
  const amber = '#F0A83B', ink = '#141920'
  const cell = (x, y, fill) => `<rect x="${x}" y="${y}" width="14" height="14" rx="2" fill="${fill}"/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <!-- CF Rentals mark: striped + amber tiles, bolt tile bottom-right -->
  <rect width="64" height="64" rx="12" fill="#FFFFFF"/>
  <defs><clipPath id="s"><rect x="8" y="8" width="14" height="14" rx="2"/></clipPath></defs>
  <g clip-path="url(#s)" stroke="${amber}" stroke-width="4" fill="none">
    <path d="M-9.3 30 30 -9.3M0 30 30 0M9.3 30 30 9.3"/>
  </g>
  ${cell(25, 8, amber)}
  ${cell(42, 8, amber)}
  ${cell(25, 25, amber)}
  ${cell(42, 25, amber)}
  ${cell(42, 42, ink)}
  <path d="M50.7 43.4 46.2 49.7h2.5l-1.4 5.2 4.8-6.6h-2.5z" fill="#FFFFFF"/>
</svg>
`
}

async function buildIcons() {
  const svg = faviconSvg()
  fs.writeFileSync(path.join(OUT, 'favicon.svg'), svg)
  const render = (size, file) =>
    sharp(Buffer.from(svg), { density: 72 * size / 64 }).resize(size, size).png({ compressionLevel: 9 }).toFile(path.join(OUT, file))
  await render(32, 'favicon-32.png')
  await render(180, 'apple-touch-icon.png')
  await render(192, 'icon-192.png')
  await render(512, 'icon-512.png')
}

;(async () => {
  await buildLockups()
  await buildIcons()
  for (const f of ['logo-cf-rentals.png', 'logo-cf-rentals-dark.png', 'logo-512.png', 'favicon.svg', 'favicon-32.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png']) {
    const m = await sharp(path.join(OUT, f)).metadata()
    console.log(f.padEnd(26), m.width + '×' + m.height, fs.statSync(path.join(OUT, f)).size + ' B')
  }
})()
