import { describe, it, expect } from 'vitest'
import { readdirSync, existsSync } from 'fs'
import { join } from 'path'

describe('Prisma migrations for Case table', () => {
  it('has exactly one migration directory under prisma/migrations/ that creates the Case table', () => {
    const migrationsDir = join(process.cwd(), 'prisma', 'migrations')
    expect(existsSync(migrationsDir), 'prisma/migrations/ directory must exist').toBe(true)

    const entries = readdirSync(migrationsDir, { withFileTypes: true })
    const migrationDirs = entries.filter(
      (e) => e.isDirectory() && e.name !== 'migration_lock.toml',
    )

    expect(
      migrationDirs.length,
      'There must be exactly one migration directory (no duplicate/split migrations)',
    ).toBe(1)

    const migrationSqlPath = join(migrationsDir, migrationDirs[0]!.name, 'migration.sql')
    expect(
      existsSync(migrationSqlPath),
      `migration.sql must exist at ${migrationSqlPath}`,
    ).toBe(true)

    const { readFileSync } = require('fs') as typeof import('fs')
    const sql = readFileSync(migrationSqlPath, 'utf-8').toLowerCase()

    expect(
      sql.includes('create table'),
      'migration.sql must contain a CREATE TABLE statement',
    ).toBe(true)

    expect(
      sql.includes('identifyingterms') || sql.includes('identifying_terms'),
      'migration.sql must define the identifyingTerms column',
    ).toBe(true)
  })
})
