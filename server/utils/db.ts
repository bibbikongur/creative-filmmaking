import Database from 'better-sqlite3'
import { randomBytes } from 'node:crypto'
import { mkdirSync, renameSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { vehicles as seedVehicles } from '~~/app/data/vehicles'
import { equipment as seedEquipment } from '~~/app/data/equipment'

// ─────────────────────────────────────────────────────────────────────────────
// SQLite on the data dir (a persistent volume in production, e.g. /data on
// Railway). Holds the catalogue (vehicles/equipment as JSON-document rows so
// the store APIs stay unchanged) plus quote requests and the offers sent for
// them. On first boot the catalogue is imported from the legacy vehicles.json/
// equipment.json files if they exist, otherwise seeded from app/data/*.ts.
// ─────────────────────────────────────────────────────────────────────────────

export const dataDir = () =>
  resolve(process.cwd(), useRuntimeConfig().dataDir || '.data')

export const uploadsDir = () => join(dataDir(), 'uploads')

// Contract/NDA template PDFs. Deliberately NOT under uploads/ — that route is
// public; these are served only through an authenticated portal endpoint.
export const docTemplatesDir = () => join(dataDir(), 'doc-templates')

// Final signed contracts/NDAs (stamped PDFs). Same privacy rules as templates.
export const signedDocsDir = () => join(dataDir(), 'signed-docs')

// Purchase-order attachments (receipt photos/PDFs). Private: streamed only
// through an authenticated portal endpoint, never via the public /uploads route.
export const poAttachmentsDir = () => join(dataDir(), 'po-attachments')

// Location-scouting photos (portal tool "tökustaðamyndir"): a downscaled full
// image plus a thumbnail per photo. Private: streamed only through an
// authenticated portal endpoint, never via the public /uploads route.
export const locationPhotosDir = () => join(dataDir(), 'location-photos')

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (db) return db
  mkdirSync(dataDir(), { recursive: true }) // better-sqlite3 won't create it
  db = new Database(join(dataDir(), 'app.sqlite'))
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('busy_timeout = 5000')
  dropLegacyTables(db)
  initSchema(db)
  migrate(db)
  importLegacyCatalogue(db)
  seedCatalogueAdditions(db)
  stripStockPhotos(db)
  return db
}

// One-time cleanup: remove Unsplash placeholder photos from catalogue rows so
// listings without real photography show the site's "no photo" placeholder.
// Only images.unsplash.com URLs are dropped — real /images/* and /uploads/*
// photos and every other field (including admin edits) are left untouched.
function stripStockPhotos(db: Database.Database) {
  const flag = 'cleanup:unsplash-images:1'
  if (db.prepare('SELECT value FROM meta WHERE key = ?').get(flag)) return

  db.transaction(() => {
    for (const table of ['vehicles', 'equipment'] as const) {
      const rows = db.prepare(`SELECT id, data FROM ${table}`).all() as { id: string, data: string }[]
      const update = db.prepare(`UPDATE ${table} SET data = ? WHERE id = ?`)
      for (const row of rows) {
        const item = JSON.parse(row.data) as { images?: string[] }
        if (!Array.isArray(item.images)) continue
        const kept = item.images.filter(src => !src.includes('images.unsplash.com'))
        if (kept.length !== item.images.length) {
          item.images = kept
          update.run(JSON.stringify(item), row.id)
          console.log(`[db] ${table}: removed stock photos from ${row.id}`)
        }
      }
    }
    db.prepare('INSERT INTO meta (key, value) VALUES (?, ?)').run(flag, '1')
  })()
}

// Seed catalogue rows added after a database was first populated. The
// first-boot import above never re-runs, so each late addition is listed here
// and inserted exactly once (guarded by a meta flag, and skipped entirely if
// the admin already created something with the same id or slug).
// (v-012 was removed 2026-08-27 when the seed file was trimmed to the live
// catalogue; its flag is already set in existing databases.)
const SEED_ADDITIONS = ['v-010', 'v-011', 'v-013']
const SEED_EQUIPMENT_ADDITIONS = ['e-016', 'e-017', 'e-018', 'e-019', 'e-020', 'e-021', 'e-022', 'e-023', 'e-024']

// One-time content refreshes: bump the rev to push the current seed data over
// what's in the database. Upserts — replaces the row if it exists (including
// any admin edits) and re-inserts it if the admin had deleted it — so only
// list a vehicle here when the seed file is the intended source of truth for
// that revision. Each rev fires at most once (meta flag).
const SEED_UPDATES: { id: string, rev: number }[] = [
  { id: 'v-010', rev: 3 },
  // SEO refresh 2026-08-27: rental keywords + copy that also targets private/
  // business renters. Seed data was synced from the live catalogue first, so
  // these upserts keep the admin's images/specs and only improve the text.
  // (v-003 is intentionally absent: it was deleted from the live catalogue,
  // and a rev entry would re-insert it.)
  { id: 'v-010', rev: 4 },
  { id: 'v-011', rev: 1 },
  { id: 'v-013', rev: 1 },
  { id: 'v-mr6s6va62bc8', rev: 1 },
  { id: 'v-mre1v2ud010c', rev: 1 },
  { id: 'v-mre45ytvabcb', rev: 1 },
  { id: 'v-mszu795f21be', rev: 1 },
]

// Equipment copy fixes pushed 2026-08-27 (SEO pass): typo/casing/translation
// cleanup, corrected facts (20 m stinger, 3-socket multiplug), taglines for
// items that had none. Same upsert-once semantics as SEED_UPDATES.
const SEED_EQUIPMENT_UPDATES: { id: string, rev: number }[] = [
  { id: 'e-mr754bhada10', rev: 1 },
  { id: 'e-mr754bmhf449', rev: 1 },
  { id: 'e-mr754brqcd2c', rev: 1 },
  { id: 'e-mr754c3jf5e5', rev: 1 },
  { id: 'e-mr754cj10dbb', rev: 1 },
  { id: 'e-mr754coccab2', rev: 1 },
  { id: 'e-023', rev: 1 },
  { id: 'e-024', rev: 1 },
  { id: 'e-mrl0eqb86480', rev: 1 },
  { id: 'e-mrl0gz0p4b08', rev: 1 },
  { id: 'e-mrl0vha3a57a', rev: 1 },
  { id: 'e-mrpk2yn45a70', rev: 1 },
  { id: 'e-mrpkv0o93613', rev: 1 },
  { id: 'e-mrpkwla84949', rev: 1 },
  { id: 'e-mrpkxz90eec4', rev: 1 },
  { id: 'e-mrpl7l4td85e', rev: 1 },
  { id: 'e-mrpl9cphbc39', rev: 1 },
  { id: 'e-mrw8w5pqb2c8', rev: 1 },
  { id: 'e-mrwb9v1v7ef1', rev: 1 },
  { id: 'e-mrzktoe5d0c9', rev: 1 },
  { id: 'e-mrzl66ydd657', rev: 1 },
  { id: 'e-mseixxnp32fb', rev: 1 },
  { id: 'e-msejvh5a659c', rev: 1 },
  { id: 'e-msoi1sx7148c', rev: 1 },
]

function seedCatalogueAdditions(db: Database.Database) {
  for (const id of SEED_ADDITIONS) {
    const flag = `seeded:vehicle:${id}`
    if (db.prepare('SELECT value FROM meta WHERE key = ?').get(flag)) continue

    const vehicle = seedVehicles.find(v => v.id === id)
    if (vehicle) {
      const exists = db.prepare('SELECT id FROM vehicles WHERE id = ? OR slug = ?').get(id, vehicle.slug)
      if (!exists) {
        const { m } = db.prepare('SELECT COALESCE(MAX(sort), -1) AS m FROM vehicles').get() as { m: number }
        db.prepare('INSERT INTO vehicles (id, slug, sort, data) VALUES (?, ?, ?, ?)')
          .run(id, vehicle.slug, m + 1, JSON.stringify(vehicle))
        console.log(`[db] vehicles: seeded late addition ${id} (${vehicle.slug})`)
      }
    }
    db.prepare('INSERT INTO meta (key, value) VALUES (?, ?)').run(flag, '1')
  }

  for (const { id, rev } of SEED_UPDATES) {
    const flag = `reseeded:vehicle:${id}:${rev}`
    if (db.prepare('SELECT value FROM meta WHERE key = ?').get(flag)) continue

    const vehicle = seedVehicles.find(v => v.id === id)
    if (vehicle) {
      const now = new Date().toISOString()
      if (db.prepare('SELECT id FROM vehicles WHERE id = ?').get(id)) {
        db.prepare('UPDATE vehicles SET slug = ?, data = ?, updated_at = ? WHERE id = ?')
          .run(vehicle.slug, JSON.stringify(vehicle), now, id)
        console.log(`[db] vehicles: reseeded ${id} (${vehicle.slug}) at rev ${rev}`)
      }
      else if (!db.prepare('SELECT id FROM vehicles WHERE slug = ?').get(vehicle.slug)) {
        const { m } = db.prepare('SELECT COALESCE(MAX(sort), -1) AS m FROM vehicles').get() as { m: number }
        db.prepare('INSERT INTO vehicles (id, slug, sort, data, updated_at) VALUES (?, ?, ?, ?, ?)')
          .run(id, vehicle.slug, m + 1, JSON.stringify(vehicle), now)
        console.log(`[db] vehicles: re-inserted ${id} (${vehicle.slug}) at rev ${rev}`)
      }
    }
    db.prepare('INSERT INTO meta (key, value) VALUES (?, ?)').run(flag, '1')
  }

  for (const id of SEED_EQUIPMENT_ADDITIONS) {
    const flag = `seeded:equipment:${id}`
    if (db.prepare('SELECT value FROM meta WHERE key = ?').get(flag)) continue

    const item = seedEquipment.find(e => e.id === id)
    if (item) {
      const exists = db.prepare('SELECT id FROM equipment WHERE id = ?').get(id)
      if (!exists) {
        const { m } = db.prepare('SELECT COALESCE(MAX(sort), -1) AS m FROM equipment').get() as { m: number }
        db.prepare('INSERT INTO equipment (id, sort, data) VALUES (?, ?, ?)')
          .run(id, m + 1, JSON.stringify(item))
        console.log(`[db] equipment: seeded late addition ${id}`)
      }
    }
    db.prepare('INSERT INTO meta (key, value) VALUES (?, ?)').run(flag, '1')
  }

  // Same one-shot upsert as SEED_UPDATES, for equipment rows. Updates the row
  // in place if it exists; a row the admin deleted stays deleted.
  for (const { id, rev } of SEED_EQUIPMENT_UPDATES) {
    const flag = `reseeded:equipment:${id}:${rev}`
    if (db.prepare('SELECT value FROM meta WHERE key = ?').get(flag)) continue

    const item = seedEquipment.find(e => e.id === id)
    if (item && db.prepare('SELECT id FROM equipment WHERE id = ?').get(id)) {
      db.prepare('UPDATE equipment SET data = ?, updated_at = ? WHERE id = ?')
        .run(JSON.stringify(item), new Date().toISOString(), id)
      console.log(`[db] equipment: reseeded ${id} at rev ${rev}`)
    }
    db.prepare('INSERT INTO meta (key, value) VALUES (?, ?)').run(flag, '1')
  }
}

/**
 * Runs BEFORE initSchema: drops tables whose old shape would make initSchema's
 * CREATE INDEX statements fail. member_docs briefly used DocuSign envelopes
 * before switching to built-in signing; that version never shipped, so the
 * table is simply rebuilt in the current shape by initSchema.
 */
function dropLegacyTables(db: Database.Database) {
  const hasEnvelope = (db.prepare('PRAGMA table_info(member_docs)').all() as { name: string }[])
    .some(c => c.name === 'envelope_id')
  if (hasEnvelope) {
    db.exec('DROP TABLE member_docs')
    console.log('[db] rebuilt member_docs for built-in signing')
  }
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS meta (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id   TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      sort INTEGER NOT NULL,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS equipment (
      id   TEXT PRIMARY KEY,
      sort INTEGER NOT NULL,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quotes (
      id         TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      status     TEXT NOT NULL DEFAULT 'new'
                 CHECK (status IN ('new', 'offered', 'won', 'lost')),
      source     TEXT NOT NULL DEFAULT 'web' CHECK (source IN ('web', 'admin')),
      locale     TEXT NOT NULL DEFAULT 'en' CHECK (locale IN ('en', 'is')),
      name    TEXT NOT NULL,
      email   TEXT NOT NULL,
      phone   TEXT,
      company TEXT,
      kennitala TEXT,
      dates   TEXT,
      message TEXT
    );

    CREATE TABLE IF NOT EXISTS quote_items (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_id  TEXT NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
      item_type TEXT NOT NULL CHECK (item_type IN ('vehicle', 'equipment')),
      item_id   TEXT NOT NULL,
      slug      TEXT,
      name_en   TEXT NOT NULL,
      name_is   TEXT NOT NULL,
      image     TEXT,
      qty       INTEGER NOT NULL DEFAULT 1
    );
    CREATE INDEX IF NOT EXISTS idx_quote_items_quote ON quote_items(quote_id);

    CREATE TABLE IF NOT EXISTS offers (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_id        TEXT NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
      created_at      TEXT NOT NULL,
      sent_at         TEXT,
      currency        TEXT NOT NULL DEFAULT 'ISK' CHECK (currency IN ('ISK', 'EUR')),
      discount_type   TEXT CHECK (discount_type IN ('percent', 'fixed')),
      discount_value  REAL,
      note            TEXT,
      valid_until     TEXT,
      items           TEXT NOT NULL,
      subtotal        REAL NOT NULL,
      discount_amount REAL NOT NULL,
      vat_rate        REAL NOT NULL DEFAULT 0,
      vat_amount      REAL NOT NULL DEFAULT 0,
      total           REAL NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_offers_quote ON offers(quote_id);

    -- ── Timesheet portal ─────────────────────────────────────────────────────

    CREATE TABLE IF NOT EXISTS companies (
      id         TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      name       TEXT NOT NULL,
      status     TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled'))
    );

    -- Global account: one email+password works across all jobs/companies.
    CREATE TABLE IF NOT EXISTS portal_users (
      id               TEXT PRIMARY KEY,
      created_at       TEXT NOT NULL,
      email            TEXT NOT NULL UNIQUE COLLATE NOCASE,
      name             TEXT,
      status           TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'disabled')),
      locale           TEXT NOT NULL DEFAULT 'en' CHECK (locale IN ('en', 'is')),
      password_hash    TEXT,
      token_hash       TEXT,
      token_expires_at TEXT,
      token_purpose    TEXT CHECK (token_purpose IN ('invite', 'reset')),
      -- Bumped whenever credentials change (password reset / invite accept) to
      -- invalidate every previously-issued session cookie for this user.
      session_epoch    INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS company_admins (
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      user_id    TEXT NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
      PRIMARY KEY (company_id, user_id)
    );

    -- Named productions, created by company admins.
    CREATE TABLE IF NOT EXISTS jobs (
      id         TEXT PRIMARY KEY,
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      name       TEXT NOT NULL,
      status     TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
      per_diem_rate INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company_id);

    -- Departments within a job (light, grip, camera, hair & makeup …). Optional:
    -- a member with no department goes straight to the job admin for approval.
    CREATE TABLE IF NOT EXISTS departments (
      id         TEXT PRIMARY KEY,
      job_id     TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      name       TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_departments_job ON departments(job_id);

    -- Employee membership in a job; the day rate lives here (per job, per person),
    -- encrypted at rest (AES-256-GCM via portalCrypto). department_id + is_dept_admin
    -- are added by migrate() on pre-existing databases.
    CREATE TABLE IF NOT EXISTS job_members (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id        TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      user_id       TEXT NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
      created_at    TEXT NOT NULL,
      status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'removed')),
      day_rate_enc  TEXT NOT NULL,
      department_id TEXT,
      is_dept_admin INTEGER NOT NULL DEFAULT 0,
      role          TEXT,
      phone         TEXT,
      po_role       TEXT CHECK (po_role IN ('none', 'log', 'log_all', 'view', 'approve')),
      po_dept_access TEXT,
      UNIQUE (job_id, user_id)
    );
    CREATE INDEX IF NOT EXISTS idx_job_members_user ON job_members(user_id);

    -- Per-job contract/NDA template: the uploaded PDF plus the admin-placed
    -- data/signature fields (JSON TemplateField[], PDF points, top-left origin).
    CREATE TABLE IF NOT EXISTS doc_templates (
      id            TEXT PRIMARY KEY,
      job_id        TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      kind          TEXT NOT NULL CHECK (kind IN ('contract', 'nda')),
      created_at    TEXT NOT NULL,
      file_name     TEXT NOT NULL,
      original_name TEXT NOT NULL,
      page_count    INTEGER NOT NULL DEFAULT 0,
      fields        TEXT NOT NULL DEFAULT '[]',
      UNIQUE (job_id, kind)
    );

    -- One signing request per (job, member, kind); resending overwrites the
    -- row and invalidates the old link. Built-in signing: the member gets an
    -- emailed token link, reviews the filled document and signs (typed name +
    -- drawn signature); the stamped PDF lands in signed-docs. Status flows
    -- sent → delivered (opened) → completed (signed) / declined.
    CREATE TABLE IF NOT EXISTS member_docs (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id           TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      user_id          TEXT NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
      kind             TEXT NOT NULL CHECK (kind IN ('contract', 'nda')),
      status           TEXT NOT NULL DEFAULT 'sent'
                       CHECK (status IN ('sent', 'delivered', 'completed', 'declined')),
      token_hash       TEXT,
      token_expires_at TEXT,
      sent_at          TEXT NOT NULL,
      sent_by          TEXT NOT NULL,
      viewed_at        TEXT,
      completed_at     TEXT,
      signed_name      TEXT,
      signed_ip        TEXT,
      signed_file      TEXT,
      UNIQUE (job_id, user_id, kind)
    );
    CREATE INDEX IF NOT EXISTS idx_member_docs_token ON member_docs(token_hash);

    -- Saved location maps (portal tool "tökustaðakort"). Personal documents:
    -- each row belongs to one portal user; pages (markers, roads, text boxes,
    -- optional uploaded background images as data URLs) live in one JSON blob.
    -- job_id optionally ties the map to one job ("Hjálpargögn" on the job page).
    CREATE TABLE IF NOT EXISTS location_maps (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
      job_id     TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      name       TEXT NOT NULL,
      pages      TEXT NOT NULL DEFAULT '[]'
    );
    CREATE INDEX IF NOT EXISTS idx_location_maps_user ON location_maps(user_id);

    -- Recce plans (portal tool "recce áætlun"). Personal per-user documents;
    -- the whole plan (stops, photos as data URLs, contacts) is one JSON blob.
    -- job_id optionally ties the plan to one job.
    CREATE TABLE IF NOT EXISTS recce_plans (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
      job_id     TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      name       TEXT NOT NULL,
      data       TEXT NOT NULL DEFAULT '{}'
    );
    CREATE INDEX IF NOT EXISTS idx_recce_plans_user ON recce_plans(user_id);

    -- Location photo albums (portal tool "tökustaðamyndir"). Personal folders,
    -- one per filming location; each holds uploaded scouting photos. Folders nest
    -- via parent_id (a self-reference — NULL for a root folder; the whole subtree
    -- is removed in the store when a folder is deleted). cover_photo_id optionally
    -- pins a cover, otherwise the first photo in the folder (or its subtree) stands
    -- in. lat/lng optionally place the folder on the overview map. job_id
    -- optionally ties a ROOT folder to one job (subfolders inherit via the root).
    CREATE TABLE IF NOT EXISTS location_albums (
      id             TEXT PRIMARY KEY,
      user_id        TEXT NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
      job_id         TEXT,
      created_at     TEXT NOT NULL,
      updated_at     TEXT NOT NULL,
      name           TEXT NOT NULL,
      note           TEXT,
      cover_photo_id TEXT,
      parent_id      TEXT,
      lat            REAL,
      lng            REAL,
      -- Pin color of a filming location ("tökustaður"); option subfolders inherit it.
      color          TEXT,
      -- 1 = this option was picked (starred) within its location.
      chosen         INTEGER NOT NULL DEFAULT 0,
      -- Quality rating 0–5 (0 = unrated) an option can be given.
      rating         INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_location_albums_user ON location_albums(user_id);
    CREATE INDEX IF NOT EXISTS idx_location_albums_parent ON location_albums(parent_id);

    -- One uploaded photo. file_name is the downscaled full image, thumb_name the
    -- grid thumbnail; both live in <dataDir>/location-photos. Deleting the album
    -- cascades the rows here (the files are removed in the store).
    CREATE TABLE IF NOT EXISTS location_photos (
      id            TEXT PRIMARY KEY,
      album_id      TEXT NOT NULL REFERENCES location_albums(id) ON DELETE CASCADE,
      user_id       TEXT NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
      created_at    TEXT NOT NULL,
      file_name     TEXT NOT NULL,
      thumb_name    TEXT NOT NULL,
      mime          TEXT NOT NULL,
      original_name TEXT NOT NULL,
      width         INTEGER NOT NULL DEFAULT 0,
      height        INTEGER NOT NULL DEFAULT 0,
      size          INTEGER NOT NULL DEFAULT 0,
      caption       TEXT,
      sort          INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_location_photos_album ON location_photos(album_id);

    -- Purchase orders (portal tool "innkaupabeiðnir", a light DPO). Department
    -- admins log costs for their department; the company admin reviews every
    -- order for the job and approves or rejects it. po_number is a per-job
    -- sequence. Optional attachment (receipt image/PDF) lives in po-attachments.
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id              TEXT PRIMARY KEY,
      job_id          TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      user_id         TEXT NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
      department_id   TEXT,
      created_at      TEXT NOT NULL,
      po_number       INTEGER NOT NULL,
      vendor          TEXT NOT NULL,
      description     TEXT,
      amount          REAL NOT NULL,
      status          TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'approved', 'rejected')),
      decided_at      TEXT,
      decided_by      TEXT,
      decision_note   TEXT,
      attachment_file TEXT,
      attachment_name TEXT,
      cost_code_id    TEXT,
      paid_at         TEXT,
      paid_by         TEXT,
      vat_rate        REAL,
      rebate_eligible INTEGER NOT NULL DEFAULT 0,
      actual_amount   REAL,
      timesheet_week_id INTEGER,
      UNIQUE (job_id, po_number)
    );
    CREATE INDEX IF NOT EXISTS idx_purchase_orders_job ON purchase_orders(job_id);
    -- The unique wages-order-per-week index lives in migrate(), not here: on a
    -- pre-v21 database this schema pass runs before the column exists.

    -- Cost codes (bókhaldslyklar) per job: orders are booked against a code
    -- (e.g. 4110 Leikmynd) so the admin gets a clear breakdown of where the
    -- money went. Managed by the company admin; a code is either shared
    -- (department_id NULL) or tied to one department, and department admins
    -- only see their own + shared codes. Deleting a code un-books its orders
    -- (cost_code_id is cleared, the orders themselves stay).
    CREATE TABLE IF NOT EXISTS po_cost_codes (
      id            TEXT PRIMARY KEY,
      job_id        TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      department_id TEXT,
      created_at    TEXT NOT NULL,
      code          TEXT NOT NULL,
      name          TEXT NOT NULL,
      budget        REAL,
      is_wages      INTEGER NOT NULL DEFAULT 0,
      UNIQUE (job_id, code)
    );
    CREATE INDEX IF NOT EXISTS idx_po_cost_codes_job ON po_cost_codes(job_id);

    -- Two-stage approval: draft → submitted → dept_approved → approved (altered
    -- branches off any review stage). altered_target records where a confirm lands.
    CREATE TABLE IF NOT EXISTS timesheet_weeks (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id       TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      user_id      TEXT NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
      week_start   TEXT NOT NULL,
      status       TEXT NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft', 'submitted', 'dept_approved', 'altered', 'approved')),
      submitted_at     TEXT,
      dept_approved_at TEXT,
      dept_approved_by TEXT,
      altered_target   TEXT CHECK (altered_target IN ('dept_approved', 'approved')),
      approved_at  TEXT,
      approved_snapshot TEXT,
      UNIQUE (user_id, job_id, week_start)
    );
    CREATE INDEX IF NOT EXISTS idx_ts_weeks_job_status ON timesheet_weeks(job_id, status);

    -- A shift belongs to its START date; end_min > 1440 means it crosses midnight.
    CREATE TABLE IF NOT EXISTS time_entries (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      week_id    INTEGER NOT NULL REFERENCES timesheet_weeks(id) ON DELETE CASCADE,
      user_id    TEXT NOT NULL,
      job_id     TEXT NOT NULL,
      date       TEXT NOT NULL,
      start_min  INTEGER NOT NULL CHECK (start_min >= 0 AND start_min < 1440),
      end_min    INTEGER NOT NULL CHECK (end_min > start_min AND end_min <= start_min + 1440),
      note       TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_time_entries_week ON time_entries(week_id);
    CREATE INDEX IF NOT EXISTS idx_time_entries_user_job_date ON time_entries(user_id, job_id, date);

    -- Per-day extras the employee ticks on the timesheet: per diem (flat amount
    -- from jobs.per_diem_rate) and running lunch (dayRate/12 for the 12th hour).
    CREATE TABLE IF NOT EXISTS timesheet_day_flags (
      week_id       INTEGER NOT NULL REFERENCES timesheet_weeks(id) ON DELETE CASCADE,
      date          TEXT NOT NULL,
      per_diem      INTEGER NOT NULL DEFAULT 0,
      running_lunch INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (week_id, date)
    );

    -- Audit trail: submissions, alterations (with before/after diff), approvals.
    CREATE TABLE IF NOT EXISTS week_events (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      week_id       INTEGER NOT NULL REFERENCES timesheet_weeks(id) ON DELETE CASCADE,
      created_at    TEXT NOT NULL,
      actor_user_id TEXT NOT NULL,
      type          TEXT NOT NULL CHECK (type IN ('submitted', 'altered', 'confirmed', 'approved', 'reopened')),
      detail        TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_week_events_week ON week_events(week_id);
  `)
}

/**
 * In-place migrations for databases created before a schema change. Idempotent
 * and self-detecting (no version table): each step checks whether it's needed.
 * Runs after initSchema(), which already creates fresh databases in the latest
 * shape via CREATE TABLE IF NOT EXISTS.
 */
function migrate(db: Database.Database) {
  const columns = (table: string) =>
    (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map(c => c.name)

  const ensureColumn = (table: string, column: string, ddl: string) => {
    if (!columns(table).includes(column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`)
  }

  // v8: catalogue rows carry updated_at (stamped on admin saves and seed
  // upserts) so the sitemap can emit lastmod and Google recrawls changes fast.
  ensureColumn('vehicles', 'updated_at', 'updated_at TEXT')
  ensureColumn('equipment', 'updated_at', 'updated_at TEXT')

  // v3: admin-created quotes carry a source marker.
  ensureColumn('quotes', 'source', "source TEXT NOT NULL DEFAULT 'web'")

  // v6: quotes can carry the customer's kennitala (Icelandic registration id).
  ensureColumn('quotes', 'kennitala', 'kennitala TEXT')

  // v5: session_epoch invalidates stale cookies after a credential change.
  ensureColumn('portal_users', 'session_epoch', 'session_epoch INTEGER NOT NULL DEFAULT 0')

  // v4: VAT itemized on offers. 0 on pre-VAT offers so old PDFs regenerate unchanged.
  ensureColumn('offers', 'vat_rate', 'vat_rate REAL NOT NULL DEFAULT 0')
  ensureColumn('offers', 'vat_amount', 'vat_amount REAL NOT NULL DEFAULT 0')

  // v2: departments on job_members.
  ensureColumn('job_members', 'department_id', 'department_id TEXT')
  ensureColumn('job_members', 'is_dept_admin', 'is_dept_admin INTEGER NOT NULL DEFAULT 0')

  // v7: crew-members tab — job title and phone number per membership.
  ensureColumn('job_members', 'role', 'role TEXT')
  ensureColumn('job_members', 'phone', 'phone TEXT')

  // v8: location-photo folders gained nesting (parent_id) and a map pin (lat/lng).
  ensureColumn('location_albums', 'parent_id', 'parent_id TEXT')
  ensureColumn('location_albums', 'lat', 'lat REAL')
  ensureColumn('location_albums', 'lng', 'lng REAL')
  db.exec('CREATE INDEX IF NOT EXISTS idx_location_albums_parent ON location_albums(parent_id)')

  // v9: per-location pin color + a "chosen" (starred) flag on option folders.
  ensureColumn('location_albums', 'color', 'color TEXT')
  ensureColumn('location_albums', 'chosen', 'chosen INTEGER NOT NULL DEFAULT 0')

  // v10: tool documents can be tied to one job ("Hjálpargögn" on the job page).
  // No FK (ALTER TABLE can't add one) — a deleted job just leaves the document
  // unlinked-but-visible on the global tools pages. Indexes live here, not in
  // initSchema, so they're only created once the column exists on old DBs.
  ensureColumn('location_maps', 'job_id', 'job_id TEXT')
  ensureColumn('recce_plans', 'job_id', 'job_id TEXT')
  ensureColumn('location_albums', 'job_id', 'job_id TEXT')
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_location_maps_job ON location_maps(job_id);
    CREATE INDEX IF NOT EXISTS idx_recce_plans_job ON recce_plans(job_id);
    CREATE INDEX IF NOT EXISTS idx_location_albums_job ON location_albums(job_id);
  `)

  // v11: options can be given a 1–5 quality rating.
  ensureColumn('location_albums', 'rating', 'rating INTEGER NOT NULL DEFAULT 0')

  // v12: purchase orders are booked against a per-job cost code (bókhaldslykill).
  ensureColumn('purchase_orders', 'cost_code_id', 'cost_code_id TEXT')

  // v13: a cost code can be tied to one department (NULL = shared by all).
  ensureColumn('po_cost_codes', 'department_id', 'department_id TEXT')

  // v14: approved purchase orders can be marked as paid.
  ensureColumn('purchase_orders', 'paid_at', 'paid_at TEXT')
  ensureColumn('purchase_orders', 'paid_by', 'paid_by TEXT')

  // v15: an optional budget (ISK) per cost code.
  ensureColumn('po_cost_codes', 'budget', 'budget REAL')

  // v17: per-member purchase-order role. NULL = derived default (dept admins
  // log for their department, everyone else has no access).
  ensureColumn('job_members', 'po_role', "po_role TEXT CHECK (po_role IN ('none', 'log', 'log_all', 'view', 'approve'))")

  // v18: which departments' PO budgets a 'log' member may work in — a JSON
  // array of department ids. NULL = just their own department.
  ensureColumn('job_members', 'po_dept_access', 'po_dept_access TEXT')

  // v19: the 'log_all' role joined the po_role CHECK. A CHECK can't be widened
  // in place, so databases that got the v17 column rebuild it: copy values
  // aside, drop, re-add with the wider CHECK, copy back.
  const jmSql = (db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'job_members'")
    .get() as { sql: string }).sql
  if (jmSql.includes('po_role') && !jmSql.includes('log_all')) {
    db.transaction(() => {
      db.exec(`
        ALTER TABLE job_members ADD COLUMN po_role_tmp TEXT;
        UPDATE job_members SET po_role_tmp = po_role;
        ALTER TABLE job_members DROP COLUMN po_role;
        ALTER TABLE job_members ADD COLUMN po_role TEXT CHECK (po_role IN ('none', 'log', 'log_all', 'view', 'approve'));
        UPDATE job_members SET po_role = po_role_tmp;
        ALTER TABLE job_members DROP COLUMN po_role_tmp;
      `)
    })()
    console.log('[db] widened job_members.po_role CHECK for the log_all role')
  }

  // v16: VAT itemization, production-rebate flag and actual paid amount on POs.
  // vat_rate stays NULL on legacy rows (unknown, not 0); actual_amount NULL
  // means the invoice matched the logged amount.
  ensureColumn('purchase_orders', 'vat_rate', 'vat_rate REAL')
  ensureColumn('purchase_orders', 'rebate_eligible', 'rebate_eligible INTEGER NOT NULL DEFAULT 0')
  ensureColumn('purchase_orders', 'actual_amount', 'actual_amount REAL')

  // v15: per-user helper-tool access. NULL = every tool (the default);
  // otherwise a JSON array of allowed tool slugs. Company admins always
  // bypass the restriction (see toolAccessStore.allowedToolsFor).
  ensureColumn('portal_users', 'tool_access', 'tool_access TEXT')

  // v20: job-wide per diem amount (ISK per ticked day; 0 = feature off).
  ensureColumn('jobs', 'per_diem_rate', 'per_diem_rate INTEGER NOT NULL DEFAULT 0')

  // v21: approved timesheet weeks book automatically as wages purchase orders.
  // is_wages marks the auto-created "Laun" cost codes; timesheet_week_id links
  // a wages order to its week (unique → booking is idempotent). Existing
  // departments are backfilled so every department has its wages code.
  ensureColumn('po_cost_codes', 'is_wages', 'is_wages INTEGER NOT NULL DEFAULT 0')
  ensureColumn('purchase_orders', 'timesheet_week_id', 'timesheet_week_id INTEGER')
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_po_timesheet_week
      ON purchase_orders(timesheet_week_id) WHERE timesheet_week_id IS NOT NULL
  `)
  // Idempotent backfill: every department gets its wages code (same shape as
  // ensureWagesCostCode in timesheetWages.ts, inlined to keep migrate self-contained).
  const deptsMissingWages = db.prepare(`
    SELECT d.id, d.job_id, d.name FROM departments d
    WHERE NOT EXISTS (
      SELECT 1 FROM po_cost_codes cc
      WHERE cc.job_id = d.job_id AND cc.is_wages = 1 AND cc.department_id = d.id
    )
  `).all() as { id: string, job_id: string, name: string }[]
  for (const d of deptsMissingWages) {
    let n = 1
    while (db.prepare('SELECT 1 FROM po_cost_codes WHERE job_id = ? AND code = ?').get(d.job_id, `LAUN-${n}`)) n++
    db.prepare('INSERT INTO po_cost_codes (id, job_id, department_id, created_at, code, name, is_wages) VALUES (?, ?, ?, ?, ?, ?, 1)')
      .run(`cc-${Date.now().toString(36)}${randomBytes(3).toString('hex')}`, d.job_id, d.id,
        new Date().toISOString(), `LAUN-${n}`, `Laun · ${d.name}`)
  }
  if (deptsMissingWages.length) console.log(`[db] created wages cost codes for ${deptsMissingWages.length} department(s)`)

  // v2: timesheet_weeks gained the 'dept_approved' status plus columns. The status
  // CHECK constraint can't be altered in place, so rebuild the table once. Detected
  // by the absence of the altered_target column (fresh DBs already have it → skip).
  if (!columns('timesheet_weeks').includes('altered_target')) {
    db.pragma('foreign_keys = OFF')
    db.transaction(() => {
      db.exec(`
        CREATE TABLE timesheet_weeks_new (
          id           INTEGER PRIMARY KEY AUTOINCREMENT,
          job_id       TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
          user_id      TEXT NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
          week_start   TEXT NOT NULL,
          status       TEXT NOT NULL DEFAULT 'draft'
                       CHECK (status IN ('draft', 'submitted', 'dept_approved', 'altered', 'approved')),
          submitted_at     TEXT,
          dept_approved_at TEXT,
          dept_approved_by TEXT,
          altered_target   TEXT CHECK (altered_target IN ('dept_approved', 'approved')),
          approved_at  TEXT,
          approved_snapshot TEXT,
          UNIQUE (user_id, job_id, week_start)
        );
        INSERT INTO timesheet_weeks_new
          (id, job_id, user_id, week_start, status, submitted_at, approved_at, approved_snapshot)
          SELECT id, job_id, user_id, week_start, status, submitted_at, approved_at, approved_snapshot
          FROM timesheet_weeks;
        DROP TABLE timesheet_weeks;
        ALTER TABLE timesheet_weeks_new RENAME TO timesheet_weeks;
        CREATE INDEX IF NOT EXISTS idx_ts_weeks_job_status ON timesheet_weeks(job_id, status);
      `)
    })()
    db.pragma('foreign_keys = ON')
    console.log('[db] migrated timesheet_weeks to the two-stage-approval schema')
  }
}

/**
 * One-time import of the legacy JSON stores. Guarded by meta flags (not
 * empty-table checks) so an admin deleting every vehicle later doesn't
 * re-trigger seeding. The source file is renamed to *.migrated-bak so a
 * stale file can never shadow the database.
 */
function importLegacyCatalogue(db: Database.Database) {
  importTable(db, 'vehicles', 'vehicles.json', seedVehicles as { id: string, slug: string }[],
    (insert, row, i) => insert.run(row.id, row.slug, i, JSON.stringify(row)),
    'INSERT OR REPLACE INTO vehicles (id, slug, sort, data) VALUES (?, ?, ?, ?)')
  importTable(db, 'equipment', 'equipment.json', seedEquipment as { id: string }[],
    (insert, row, i) => insert.run(row.id, i, JSON.stringify(row)),
    'INSERT OR REPLACE INTO equipment (id, sort, data) VALUES (?, ?, ?)')
}

function importTable<T extends { id: string }>(
  db: Database.Database,
  table: 'vehicles' | 'equipment',
  legacyFile: string,
  seed: T[],
  insertRow: (insert: Database.Statement, row: T, index: number) => void,
  insertSql: string,
) {
  const flag = `migrated:${table}`
  const done = db.prepare('SELECT value FROM meta WHERE key = ?').get(flag)
  if (done) return

  const legacyPath = join(dataDir(), legacyFile)
  let rows = seed
  let fromLegacy = false
  try {
    rows = JSON.parse(readFileSync(legacyPath, 'utf8')) as T[]
    fromLegacy = true
  }
  catch {
    // No legacy file (fresh install) — fall back to the seed catalogue.
  }

  const insert = db.prepare(insertSql)
  db.transaction(() => {
    rows.forEach((row, i) => insertRow(insert, row, i))
    db.prepare('INSERT INTO meta (key, value) VALUES (?, ?)')
      .run(flag, new Date().toISOString())
  })()

  if (fromLegacy) {
    try {
      renameSync(legacyPath, `${legacyPath}.migrated-bak`)
    }
    catch {
      // Read-only FS in some dev setups — the meta flag already prevents re-import.
    }
  }
  console.log(`[db] ${table}: imported ${rows.length} rows from ${fromLegacy ? legacyFile : 'seed data'}`)
}
