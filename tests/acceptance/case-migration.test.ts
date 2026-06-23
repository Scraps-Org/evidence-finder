import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

describe('Case migration file', () => {
  it('has exactly one migration directory under prisma/migrations/ that creates the Case table with identifyingTerms', () => {
    const migrationsDir = path.resolve(process.cwd(), 'prisma', 'migrations')
    expect(fs.existsSync(migrationsDir), 'prisma/migrations/ directory must exist').toBe(true)

    const entries = fs.readdirSync(migrationsDir).filter(
      (e) => fs.statSync(path.join(migrationsDir, e)).isDirectory(),
    )
    expect(entries.length, 'exactly one migration directory must exist under prisma/migrations/').toBe(1)

    const sqlFile = path.join(migrationsDir, entries[0]!, 'migration.sql')
    expect(fs.existsSync(sqlFile), `migration.sql must exist at ${sqlFile}`).toBe(true)

    const sql = fs.readFileSync(sqlFile, 'utf-8').toLowerCase()
    expect(sql, 'migration must CREATE the Case table').toMatch(/create table/)
    expect(sql, 'migration must include the identifyingterms column').toMatch(/identifyingterms/)
  })

  it('prisma/schema.prisma defines a Case model with identifyingTerms', () => {
    const schemaPath = path.resolve(process.cwd(), 'prisma', 'schema.prisma')
    expect(fs.existsSync(schemaPath), 'prisma/schema.prisma must exist').toBe(true)

    const schema = fs.readFileSync(schemaPath, 'utf-8')
    expect(schema, 'schema must define a Case model').toMatch(/model\s+Case/)
    expect(schema, 'schema must include identifyingTerms field').toMatch(/identifyingTerms/)
  })
})
