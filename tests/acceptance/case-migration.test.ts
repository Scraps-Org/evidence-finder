import { describe, it, expect, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

afterAll(async () => {
  await prisma.$disconnect()
})

describe('Case table migration', () => {
  it('exactly one migration file creates the Case table', () => {
    const migrationsRoot = path.resolve('prisma/migrations')
    expect(fs.existsSync(migrationsRoot), 'prisma/migrations directory must exist').toBe(true)

    const entries = fs.readdirSync(migrationsRoot, { withFileTypes: true })
    const migrationDirs = entries.filter((e) => e.isDirectory())

    const caseTableMigrations = migrationDirs.filter((dir) => {
      const sqlPath = path.join(migrationsRoot, dir.name, 'migration.sql')
      if (!fs.existsSync(sqlPath)) return false
      const sql = fs.readFileSync(sqlPath, 'utf-8').toUpperCase()
      return sql.includes('CREATE TABLE') && (sql.includes('"CASE"') || sql.includes('`CASE`') || sql.includes('CASE'))
    })

    expect(
      caseTableMigrations.length,
      `Expected exactly 1 migration creating the Case table, found ${caseTableMigrations.length}: ${caseTableMigrations.map((d) => d.name).join(', ')}`
    ).toBe(1)
  })

  it('can round-trip a Case row through the real database', async () => {
    const terms = `migration-probe-${Date.now()}`
    const created = await prisma.case.create({ data: { identifyingTerms: terms } })
    expect(created.identifyingTerms).toBe(terms)
    const found = await prisma.case.findUnique({ where: { id: created.id } })
    expect(found).not.toBeNull()
    expect(found!.identifyingTerms).toBe(terms)
    await prisma.case.delete({ where: { id: created.id } })
  })
})
