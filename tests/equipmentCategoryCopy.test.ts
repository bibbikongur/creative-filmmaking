import Database from 'better-sqlite3'
import { describe, expect, it } from 'vitest'
import { refreshEquipmentCategoryCopy } from '../server/utils/equipmentCategoryRestructure'

// The copy refresh must replace text fields from CATEGORIES and leave what the
// admin controls (slug, previousSlugs, sort, status) exactly as it found it.

function freshDb() {
  const db = new Database(':memory:')
  db.exec(`
    CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE equipment_categories (
      id TEXT PRIMARY KEY, sort INTEGER NOT NULL, status TEXT NOT NULL,
      data TEXT NOT NULL, updated_at TEXT
    );
  `)
  return db
}

const adminRow = {
  slug: { is: 'hitarar-admin', en: 'heaters-admin' },
  name: { is: 'Gamalt', en: 'Old' },
  title: { is: 'Gamalt', en: 'Old' },
  metaTitle: { is: 'Gamalt', en: 'Heater Rental for Film Shoots' },
  metaDescription: { is: '', en: '' },
  intro: [],
  faq: [],
  previousSlugs: ['hitablasarar', 'heaters'],
}

describe('refreshEquipmentCategoryCopy', () => {
  it('rewrites copy fields, keeps slugs/previousSlugs/sort/status, and runs once', () => {
    const db = freshDb()
    db.prepare('INSERT INTO equipment_categories VALUES (?, ?, ?, ?, ?)')
      .run('heating', 7, 'archived', JSON.stringify(adminRow), '2026-01-01T00:00:00.000Z')

    refreshEquipmentCategoryCopy(db)

    const row = db.prepare('SELECT sort, status, data, updated_at FROM equipment_categories WHERE id = ?').get('heating') as
      { sort: number, status: string, data: string, updated_at: string }
    const data = JSON.parse(row.data)
    expect(data.metaTitle.en).toContain('in Iceland')
    expect(data.name.en).toBe('Heaters')
    expect(data.intro.length).toBeGreaterThan(0)
    expect(data.slug).toEqual(adminRow.slug)
    expect(data.previousSlugs).toEqual(adminRow.previousSlugs)
    expect(row.sort).toBe(7)
    expect(row.status).toBe('archived')
    expect(row.updated_at).not.toBe('2026-01-01T00:00:00.000Z')

    // Second run is a no-op: the flag is set, so an admin edit made later survives.
    data.metaTitle.en = 'Edited in admin'
    db.prepare('UPDATE equipment_categories SET data = ? WHERE id = ?').run(JSON.stringify(data), 'heating')
    refreshEquipmentCategoryCopy(db)
    const again = JSON.parse((db.prepare('SELECT data FROM equipment_categories WHERE id = ?').get('heating') as { data: string }).data)
    expect(again.metaTitle.en).toBe('Edited in admin')
  })

  it('skips categories that do not exist in the database', () => {
    const db = freshDb()
    expect(() => refreshEquipmentCategoryCopy(db)).not.toThrow()
    expect(db.prepare('SELECT COUNT(*) AS n FROM equipment_categories').get()).toEqual({ n: 0 })
  })
})
