import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

describe('prisma/migrations/ Case table migration', () => {
  it('has exactly one migration file that creates the Case table with identifyingTerms column', () => {
    const migrationsDir = path.resolve(process.cwd(), 'prisma', 'migrations')
    expect(fs.existsSync(migrationsDir), 'prisma/migrations/ directory must exist').toBe(true)

    const entries = fs.readdirSync(migrationsDir, { withFileTypes: true })
    const migrationDirs = entries.filter(
      (e) => e.isDirectory() && e.name !== '.keep',
    )
    expect(
      migrationDirs.length,
      'exactly one migration directory must exist under prisma/migrations/',
    ).toBe(1)

    const sqlPath = path.join(migrationsDir, migrationDirs[0]!.name, 'migration.sql')
    expect(fs.existsSync(sqlPath), `migration.sql must exist at ${sqlPath}`).toBe(true)

    const sql = fs.readFileSync(sqlPath, 'utf-8')
    expect(sql.toLowerCase()).toMatch(/create table/)
    expect(sql).toMatch(/"?[Cc]ase"?|"?cases"?/)
    expect(sql).toMatch(/"?identifyingTerms"?/)
  })
})
