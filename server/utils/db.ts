import Database from 'better-sqlite3'
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

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (db) return db
  mkdirSync(dataDir(), { recursive: true }) // better-sqlite3 won't create it
  db = new Database(join(dataDir(), 'app.sqlite'))
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('busy_timeout = 5000')
  initSchema(db)
  migrate(db)
  importLegacyCatalogue(db)
  seedCatalogueAdditions(db)
  return db
}

// Seed catalogue rows added after a database was first populated. The
// first-boot import above never re-runs, so each late addition is listed here
// and inserted exactly once (guarded by a meta flag, and skipped entirely if
// the admin already created something with the same id or slug).
const SEED_ADDITIONS = ['v-010', 'v-011', 'v-012']
const SEED_EQUIPMENT_ADDITIONS = ['e-016', 'e-017', 'e-018', 'e-019', 'e-020', 'e-021', 'e-022', 'e-023', 'e-024']

// One-time content refreshes: bump the rev to push the current seed data over
// what's in the database. Upserts — replaces the row if it exists (including
// any admin edits) and re-inserts it if the admin had deleted it — so only
// list a vehicle here when the seed file is the intended source of truth for
// that revision. Each rev fires at most once (meta flag).
const SEED_UPDATES: { id: string, rev: number }[] = [
  { id: 'v-010', rev: 3 },
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
      if (db.prepare('SELECT id FROM vehicles WHERE id = ?').get(id)) {
        db.prepare('UPDATE vehicles SET slug = ?, data = ? WHERE id = ?')
          .run(vehicle.slug, JSON.stringify(vehicle), id)
        console.log(`[db] vehicles: reseeded ${id} (${vehicle.slug}) at rev ${rev}`)
      }
      else if (!db.prepare('SELECT id FROM vehicles WHERE slug = ?').get(vehicle.slug)) {
        const { m } = db.prepare('SELECT COALESCE(MAX(sort), -1) AS m FROM vehicles').get() as { m: number }
        db.prepare('INSERT INTO vehicles (id, slug, sort, data) VALUES (?, ?, ?, ?)')
          .run(id, vehicle.slug, m + 1, JSON.stringify(vehicle))
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
      token_purpose    TEXT CHECK (token_purpose IN ('invite', 'reset'))
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
      status     TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed'))
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
      UNIQUE (job_id, user_id)
    );
    CREATE INDEX IF NOT EXISTS idx_job_members_user ON job_members(user_id);

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

  // v3: admin-created quotes carry a source marker.
  ensureColumn('quotes', 'source', "source TEXT NOT NULL DEFAULT 'web'")

  // v4: VAT itemized on offers. 0 on pre-VAT offers so old PDFs regenerate unchanged.
  ensureColumn('offers', 'vat_rate', 'vat_rate REAL NOT NULL DEFAULT 0')
  ensureColumn('offers', 'vat_amount', 'vat_amount REAL NOT NULL DEFAULT 0')

  // v2: departments on job_members.
  ensureColumn('job_members', 'department_id', 'department_id TEXT')
  ensureColumn('job_members', 'is_dept_admin', 'is_dept_admin INTEGER NOT NULL DEFAULT 0')

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
