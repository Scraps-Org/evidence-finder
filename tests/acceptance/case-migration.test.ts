import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

describe('prisma/migrations — Case table migration', () => {
  it('has exactly one migration directory under prisma/migrations/', () => {
    const migrationsDir = join(process.cwd(), 'prisma', 'migrations')
    const entries = readdirSync(migrationsDir, { withFileTypes: true })
    const migrationDirs = entries.filter(
      (e) => e.isDirectory() && e.name !== 'migration_lock.toml',
    )
    expect(migrationDirs).toHaveLength(1)
  })

  it('the migration SQL creates a Case table with an identifyingTerms text column', () => {
    const migrationsDir = join(process.cwd(), 'prisma', 'migrations')
    const entries = readdirSync(migrationsDir, { withFileTypes: true })
    const migrationDir = entries.find(
      (e) => e.isDirectory() && e.name !== 'migration_lock.toml',
    )
    expect(migrationDir).toBeDefined()

    const sqlPath = join(migrationsDir, migrationDir!.name, 'migration.sql')
    const sql = readFileSync(sqlPath, 'utf-8').toLowerCase()

    expect(sql).toMatch(/create\s+table/i)
    expect(sql).toMatch(/"?case"?/i)
    expect(sql).toMatch(/"?identifyingterms"?/i)
    expect(sql).toMatch(/text/i)
  })
})
