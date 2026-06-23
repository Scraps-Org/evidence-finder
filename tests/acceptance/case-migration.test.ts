import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

describe('D2-case-input: Prisma migration for Case table', () => {
  it('has exactly one migration directory under prisma/migrations/', () => {
    const migrationsDir = path.resolve('prisma/migrations')
    const entries = fs
      .readdirSync(migrationsDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
    expect(entries).toHaveLength(1)
  })

  it('the single migration SQL creates the Case table with an identifyingTerms text column', () => {
    const migrationsDir = path.resolve('prisma/migrations')
    const dirs = fs
      .readdirSync(migrationsDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
    expect(dirs).toHaveLength(1)

    const sqlPath = path.join(migrationsDir, dirs[0]!.name, 'migration.sql')
    const sql = fs.readFileSync(sqlPath, 'utf-8')

    expect(sql.toLowerCase()).toMatch(/create\s+table/)
    expect(sql.toLowerCase()).toMatch(/"?case"?/i)
    expect(sql.toLowerCase()).toMatch(/"?identifyingterms"?/i)
    expect(sql.toLowerCase()).toMatch(/text/)
  })

  it('the Prisma schema defines a Case model with an identifyingTerms field', () => {
    const schemaPath = path.resolve('prisma/schema.prisma')
    const schema = fs.readFileSync(schemaPath, 'utf-8')

    expect(schema).toMatch(/model\s+Case\s*\{/)
    expect(schema).toMatch(/identifyingTerms/)
  })
})
