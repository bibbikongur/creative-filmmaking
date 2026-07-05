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
  importLegacyCatalogue(db)
  return db
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

    -- Employee membership in a job; the day rate lives here (per job, per person),
    -- encrypted at rest (AES-256-GCM via portalCrypto).
    CREATE TABLE IF NOT EXISTS job_members (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id       TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      user_id      TEXT NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
      created_at   TEXT NOT NULL,
      status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'removed')),
      day_rate_enc TEXT NOT NULL,
      UNIQUE (job_id, user_id)
    );
    CREATE INDEX IF NOT EXISTS idx_job_members_user ON job_members(user_id);

    CREATE TABLE IF NOT EXISTS timesheet_weeks (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id       TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      user_id      TEXT NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
      week_start   TEXT NOT NULL,
      status       TEXT NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft', 'submitted', 'altered', 'approved')),
      submitted_at TEXT,
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
