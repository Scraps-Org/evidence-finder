import * as fs from 'fs'
import * as path from 'path'

const MIGRATIONS_DIR = path.resolve(__dirname, '../../prisma/migrations')

describe('prisma/migrations', () => {
  it('directory exists and contains exactly one migration', () => {
    expect(fs.existsSync(MIGRATIONS_DIR)).toBe(true)
    const entries = fs.readdirSync(MIGRATIONS_DIR).filter(
      (name) => fs.statSync(path.join(MIGRATIONS_DIR, name)).isDirectory()
    )
    expect(entries).toHaveLength(1)
  })

  it('the single migration SQL creates the Case table with an identifyingTerms text column', () => {
    const entries = fs.readdirSync(MIGRATIONS_DIR).filter(
      (name) => fs.statSync(path.join(MIGRATIONS_DIR, name)).isDirectory()
    )
    const migrationDir = path.join(MIGRATIONS_DIR, entries[0]!)
    const sqlFile = path.join(migrationDir, 'migration.sql')

    expect(fs.existsSync(sqlFile)).toBe(true)

    const sql = fs.readFileSync(sqlFile, 'utf-8').toLowerCase()

    expect(sql).toMatch(/create\s+table/)
    expect(sql).toMatch(/"case"|\bcase\b/)
    expect(sql).toMatch(/"identifyingterms"|identifyingterms/)
    expect(sql).toMatch(/text|varchar/)
  })
})
