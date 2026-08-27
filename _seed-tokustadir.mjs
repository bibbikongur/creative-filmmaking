// One-off seeding script: fills the three location tools (tökustaðakort,
// tökustaðamyndir, recce áætlun) with a coherent Test Production dataset so the
// whole location-scouting flow can be reviewed with realistic data.
//
//   node _seed-tokustadir.mjs
//
// Idempotent: every row it creates carries the id prefix `seedtp-`, and the
// script deletes those (and their image files) before re-inserting.
import Database from 'better-sqlite3'
import sharp from 'sharp'
import { writeFileSync, mkdirSync, unlinkSync } from 'node:fs'
import { join, resolve } from 'node:path'

const USER = 'u-mt4ncztuaecaf6' // test@example.com ("Test Admin")
const JOB = 'j-mt4pxrxlbd8241' // "Test Production"
const NOW = new Date().toISOString()
const DB_PATH = resolve('./.data/app.sqlite')
const PHOTO_DIR = resolve('./.data/location-photos')

const db = new Database(DB_PATH)
db.pragma('busy_timeout = 8000')
db.pragma('foreign_keys = ON')

// ── image helpers ────────────────────────────────────────────────────────────
// Solid-colour JPEGs (no fonts needed → renders identically on any platform).
// The photo captions in the DB carry the human-readable names.
const genFiles = [] // remember written files so a re-run can purge them
async function jpegBuf(w, h, rgb) {
  return sharp({ create: { width: w, height: h, channels: 3, background: rgb } }).jpeg({ quality: 80 }).toBuffer()
}
async function jpegDataUrl(w, h, rgb) {
  const b = await jpegBuf(w, h, rgb)
  return `data:image/jpeg;base64,${b.toString('base64')}`
}
const PALETTE = [
  { r: 63, g: 94, b: 128 }, { r: 120, g: 95, b: 70 }, { r: 74, g: 110, b: 80 },
  { r: 128, g: 78, b: 96 }, { r: 90, g: 96, b: 120 }, { r: 110, g: 110, b: 70 },
  { r: 70, g: 118, b: 118 }, { r: 128, g: 100, b: 60 },
]

// ── cleanup of a previous run ────────────────────────────────────────────────
const purge = db.transaction(() => {
  // photo files first (rows cascade when albums are deleted)
  const files = db.prepare("SELECT file_name, thumb_name FROM location_photos WHERE id LIKE 'seedtp-%'").all()
  for (const f of files) {
    for (const n of [f.file_name, f.thumb_name]) {
      try { unlinkSync(join(PHOTO_DIR, n)) } catch { /* already gone */ }
    }
  }
  db.prepare("DELETE FROM location_photos WHERE id LIKE 'seedtp-%'").run()
  db.prepare("DELETE FROM location_albums WHERE id LIKE 'seedtp-%'").run()
  db.prepare("DELETE FROM location_maps  WHERE id LIKE 'seedtp-%'").run()
  db.prepare("DELETE FROM recce_plans    WHERE id LIKE 'seedtp-%'").run()
})
purge()

// ── prepared statements ──────────────────────────────────────────────────────
const insAlbum = db.prepare(`INSERT INTO location_albums
  (id, user_id, job_id, created_at, updated_at, name, note, parent_id, lat, lng, color, chosen, rating, cover_photo_id)
  VALUES (@id, @user_id, @job_id, @created_at, @updated_at, @name, @note, @parent_id, @lat, @lng, @color, @chosen, @rating, @cover_photo_id)`)
const insPhoto = db.prepare(`INSERT INTO location_photos
  (id, album_id, user_id, created_at, file_name, thumb_name, mime, original_name, width, height, size, caption, sort)
  VALUES (@id, @album_id, @user_id, @created_at, @file_name, @thumb_name, @mime, @original_name, @width, @height, @size, @caption, @sort)`)
const insMap = db.prepare(`INSERT INTO location_maps
  (id, user_id, job_id, created_at, updated_at, name, pages) VALUES (?, ?, ?, ?, ?, ?, ?)`)
const insRecce = db.prepare(`INSERT INTO recce_plans
  (id, user_id, created_at, updated_at, name, data, job_id) VALUES (?, ?, ?, ?, ?, ?, ?)`)

let pc = 0
// Write one photo (full + thumb) to disk and return its DB row id.
async function addPhoto(albumId, sort, caption, colorIdx) {
  const id = `seedtp-lp-${++pc}`
  const rgb = PALETTE[colorIdx % PALETTE.length]
  const full = await jpegBuf(1600, 1067, rgb)
  const thumb = await jpegBuf(480, 320, rgb)
  const fileName = `${id}.jpg`
  const thumbName = `${id}.thumb.jpg`
  mkdirSync(PHOTO_DIR, { recursive: true })
  writeFileSync(join(PHOTO_DIR, fileName), full)
  writeFileSync(join(PHOTO_DIR, thumbName), thumb)
  genFiles.push(fileName, thumbName)
  insPhoto.run({
    id, album_id: albumId, user_id: USER, created_at: NOW,
    file_name: fileName, thumb_name: thumbName, mime: 'image/jpeg',
    original_name: `${caption}.jpg`, width: 1600, height: 1067, size: full.length,
    caption, sort,
  })
  return id
}

let ac = 0
function addAlbum({ name, note = null, parentId = null, lat = null, lng = null, color = null, chosen = 0, rating = 0 }) {
  const id = `seedtp-la-${++ac}`
  insAlbum.run({
    id, user_id: USER, job_id: parentId ? null : JOB, created_at: NOW, updated_at: NOW,
    name, note, parent_id: parentId, lat, lng, color, chosen, rating, cover_photo_id: null,
  })
  return id
}

async function run() {
  // ══ 1) TÖKUSTAÐAMYNDIR (albums + photos) ══════════════════════════════════
  // Three locations. Two are containers with option subfolders (one chosen each,
  // to exercise the "chosen hides the rejected options" logic + star pins);
  // one is a single leaf-root pin.

  // Location 1 — a container with two options, option 1 chosen.
  const loc1 = addAlbum({ name: 'Heimili aðalpersónu', note: 'Innitökur — stofa, eldhús og svefnherbergi. Barnvænt, bílastæði við hús.' })
  const l1o1 = addAlbum({ name: 'Option 1 — Þingholtsstræti 5', note: '2 hæðir, gott morgunljós í stofu. Eigandi jákvæður.', parentId: loc1, lat: 64.1440, lng: -21.9270, color: '#26c6a2', chosen: 1, rating: 4 })
  const l1o2 = addAlbum({ name: 'Option 2 — Ránargata 12', note: 'Þröngt en mikill karakter. Erfitt aðgengi fyrir tæki.', parentId: loc1, lat: 64.1495, lng: -21.9430, rating: 3 })
  const l1o1cover = await addPhoto(l1o1, 0, 'Stofa — morgunljós', 0)
  await addPhoto(l1o1, 1, 'Eldhús', 1)
  await addPhoto(l1o1, 2, 'Framhlið hússins', 2)
  db.prepare('UPDATE location_albums SET cover_photo_id = ? WHERE id = ?').run(l1o1cover, l1o1)
  await addPhoto(l1o2, 0, 'Stofa — Ránargata', 3)
  await addPhoto(l1o2, 1, 'Bakgarður', 4)

  // Location 2 — harbour, two options, "Bryggjan" chosen.
  const loc2 = addAlbum({ name: 'Höfnin / Grandi', note: 'Útitökur við höfnina. Athuga vindaspá og lokanir vegna löndunar.' })
  const l2o1 = addAlbum({ name: 'Bryggjan', note: 'Aðal-útitökustaður. Rúmgott fyrir tæknibíla.', parentId: loc2, lat: 64.1573, lng: -21.9490, color: '#2f80ed', chosen: 1, rating: 5 })
  const l2o2 = addAlbum({ name: 'Fiskvinnsluhús', note: 'Interior/exterior blanda. Lykt og hávaði geta verið vandamál.', parentId: loc2, lat: 64.1585, lng: -21.9540, rating: 2 })
  const l2o1cover = await addPhoto(l2o1, 0, 'Bryggjan í kvöldsól', 5)
  await addPhoto(l2o1, 1, 'Útsýni yfir höfnina', 6)
  await addPhoto(l2o1, 2, 'Aðkoma tæknibíla', 7)
  db.prepare('UPDATE location_albums SET cover_photo_id = ? WHERE id = ?').run(l2o1cover, l2o1)
  await addPhoto(l2o2, 0, 'Fiskvinnsluhús — inni', 0)
  await addPhoto(l2o2, 1, 'Hlaðið', 1)

  // Location 3 — a single leaf-root pin (no options).
  const loc3 = addAlbum({ name: 'Grótta viti', note: 'Lokað á háflóði — athuga sjávarföll fyrir tökudag! Fuglafriðland maí–júlí.', lat: 64.1663, lng: -22.0290, color: '#ff9d00', rating: 4 })
  const l3cover = await addPhoto(loc3, 0, 'Vitinn', 2)
  await addPhoto(loc3, 1, 'Fjaran við háflóð', 3)
  db.prepare('UPDATE location_albums SET cover_photo_id = ? WHERE id = ?').run(l3cover, loc3)

  // ══ 2) TÖKUSTAÐAKORT (location map) ════════════════════════════════════════
  // Two pages. Page 1 (satellite) exercises every marker kind, a road, text
  // boxes, shapes (rect + circle) and vehicles (truck/semi/van). Page 2
  // (streets) exercises a dashed road + numbered set pin at Þingvellir.
  const pages = [
    {
      id: 'p1', title: 'Grandi — set & basecamp', base: 'satellite',
      center: { lat: 64.1570, lng: -21.9490 }, zoom: 16,
      markers: [
        { id: 'm1', kind: 'basecamp', lat: 64.1560, lng: -21.9450, label: 'Basecamp' },
        { id: 'm2', kind: 'set', lat: 64.1575, lng: -21.9495, label: 'Bryggjan', num: 1 },
        { id: 'm3', kind: 'set', lat: 64.1585, lng: -21.9540, label: 'Fiskvinnsluhús', num: 2 },
        { id: 'm4', kind: 'parking', lat: 64.1555, lng: -21.9462, label: 'Crew parking' },
        { id: 'm5', kind: 'trucks', lat: 64.1566, lng: -21.9520, label: 'Tæknibílar' },
        { id: 'm6', kind: 'catering', lat: 64.1558, lng: -21.9442, label: 'Catering' },
        { id: 'm7', kind: 'wc', lat: 64.1562, lng: -21.9436 },
        { id: 'm8', kind: 'custom', lat: 64.1578, lng: -21.9472, label: 'Video village' },
      ],
      roads: [{
        id: 'r1', color: '#ffd75e', width: 4, dashed: false,
        points: [{ lat: 64.1552, lng: -21.9430 }, { lat: 64.1568, lng: -21.9490 }, { lat: 64.1585, lng: -21.9545 }],
      }],
      texts: [
        { id: 't1', lat: 64.1590, lng: -21.9500, text: 'SET SVÆÐI', size: 18, color: '#ffd75e' },
        { id: 't2', lat: 64.1550, lng: -21.9455, text: 'Basecamp / crew', size: 14, color: '#ffffff' },
      ],
      shapes: [
        { id: 's1', shape: 'rect', a: { lat: 64.1556, lng: -21.9472 }, b: { lat: 64.1562, lng: -21.9450 }, color: '#2f80ed', width: 2, fill: true, fillOpacity: 0.2 },
        { id: 's2', shape: 'circle', a: { lat: 64.1582, lng: -21.9502 }, b: { lat: 64.1586, lng: -21.9512 }, color: '#eb5757', width: 2, fill: true, fillOpacity: 0.15 },
      ],
      vehicles: [
        { id: 'v1', kind: 'truck', lat: 64.1566, lng: -21.9516, lengthM: 9, widthM: 2.5, rotation: 30, color: '#cbd5e1', label: 'Ljósabíll' },
        { id: 'v2', kind: 'semi', lat: 64.1568, lng: -21.9525, lengthM: 16, widthM: 2.6, rotation: 30, color: '#f2c94c', label: 'Grip' },
        { id: 'v3', kind: 'van', lat: 64.1563, lng: -21.9510, lengthM: 5.5, widthM: 2, rotation: 30, color: '#8d6eff', label: 'Búningar' },
      ],
    },
    {
      id: 'p2', title: 'Þingvellir — Almannagjá', base: 'streets',
      center: { lat: 64.2559, lng: -21.1295 }, zoom: 14,
      markers: [
        { id: 'm9', kind: 'set', lat: 64.2559, lng: -21.1295, label: 'Almannagjá', num: 3 },
        { id: 'm10', kind: 'parking', lat: 64.2555, lng: -21.1250, label: 'Bílastæði P1' },
        { id: 'm11', kind: 'basecamp', lat: 64.2548, lng: -21.1230, label: 'Unit base' },
      ],
      roads: [{
        id: 'r2', color: '#ffd75e', width: 3, dashed: true,
        points: [{ lat: 64.2548, lng: -21.1230 }, { lat: 64.2555, lng: -21.1250 }, { lat: 64.2559, lng: -21.1295 }],
      }],
      texts: [{ id: 't3', lat: 64.2566, lng: -21.1295, text: 'Ytri tökustaður — Þingvellir', size: 16, color: '#ffd75e' }],
      shapes: [],
      vehicles: [],
    },
  ]
  insMap.run('seedtp-lm-1', USER, JOB, NOW, NOW, 'Test Production — Tökustaðakort', JSON.stringify(pages))

  // ══ 3) RECCE ÁÆTLUN (timed location schedule) ══════════════════════════════
  // One start time; each stop's dwell + drive chains the arrival/departure. Fills
  // every field: manual coords, link-derived (auto) coords, photos, contacts.
  const recceP = [
    await jpegDataUrl(700, 466, PALETTE[0]),
    await jpegDataUrl(700, 466, PALETTE[2]),
    await jpegDataUrl(700, 466, PALETTE[4]),
    await jpegDataUrl(700, 466, PALETTE[6]),
  ]
  const recce = {
    subtitle: 'Tech recce',
    date: '2026-09-03',
    startTime: '08:00',
    note: 'Mæting á basecamp kl. 08:00. Takið með hlý föt og góða skó — Grótta getur verið blaut. Bílstjóri: Jón.',
    stops: [
      {
        name: 'Basecamp / framleiðsluskrifstofa', address: 'Engjateigur 9, 105 Reykjavík',
        notes: 'Stutt kynning, útdeiling á labb-rásum og öryggisbriefing.',
        link: '', coords: '64.1400, -21.8760', photos: [recceP[0]],
        durationMin: 30, travelMin: 25,
      },
      {
        name: 'Heimili aðalpersónu — Þingholtsstræti 5', address: 'Þingholtsstræti 5, 101 Reykjavík',
        notes: 'Skoða ljós í stofu að morgni, mæla rými fyrir dolly. Eigandi tekur á móti.',
        link: 'https://www.google.com/maps/@64.1440,-21.9270,18z', coords: '64.144, -21.927', coordsAuto: true,
        photos: [recceP[1], recceP[2]], durationMin: 90, travelMin: 15,
      },
      {
        name: 'Höfnin — Bryggjan', address: 'Grandagarður, 101 Reykjavík',
        notes: 'Aðal-útitökustaður. Staðfesta lokun og aðkomu tæknibíla. Athuga vind.',
        link: '', coords: '64.1573, -21.9490', photos: [recceP[3]],
        durationMin: 60, travelMin: 35,
      },
      {
        name: 'Grótta viti', address: 'Grótta, 170 Seltjarnarnes',
        notes: 'LOKAÐ Á HÁFLÓÐI — háflóð kl. 15:10 þennan dag, verðum farin fyrir þann tíma.',
        link: '', coords: '64.1663, -22.0290', photos: [],
        durationMin: 75, travelMin: 0,
      },
    ],
    contacts: [
      { name: 'Sara Location', role: 'Location manager', phone: '+354 771 2233' },
      { name: 'Jón Bílstjóri', role: 'Unit driver', phone: '+354 662 4410' },
      { name: 'Anna Öryggi', role: 'Öryggisfulltrúi', phone: '+354 899 0102' },
    ],
  }
  insRecce.run('seedtp-rp-1', USER, NOW, NOW, 'Test Production — tökustaðaáætlun', JSON.stringify(recce), JOB)
}

await run()
db.close()
console.log(`Seeded Test Production location data. Wrote ${genFiles.length} image files.`)
