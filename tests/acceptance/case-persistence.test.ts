import { describe, it, expect, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

describe('Case Persistence & Schema', () => {
  afterEach(async () => {
    await prisma.case.deleteMany({});
    await prisma.$disconnect();
  });

  it('Prisma schema defines a Case model with id and terms fields', async () => {
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    expect(schema).toContain('model Case');
    expect(schema).toMatch(/id\s+String\s+@id/);
    expect(schema).toMatch(/terms\s+String/);
  });

  it('migration file exists under prisma/migrations/ that creates Case table', async () => {
    const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
    expect(fs.existsSync(migrationsDir)).toBe(true);

    const migrations = fs.readdirSync(migrationsDir);
    const casesMigration = migrations.find((m) => m.includes('case'));
    expect(casesMigration).toBeDefined();

    const migrationSqlPath = path.join(migrationsDir, casesMigration!, 'migration.sql');
    const migrationSql = fs.readFileSync(migrationSqlPath, 'utf-8');

    expect(migrationSql.toUpperCase()).toContain('CREATE TABLE');
    expect(migrationSql.toUpperCase()).toContain('"Case"');
  });

  it('round-trips: creates and retrieves a case row from the database', async () => {
    const uniqueTerms = `Persistence Test ${Date.now()}`;

    const created = await prisma.case.create({
      data: { terms: uniqueTerms },
    });

    expect(created.id).toBeDefined();
    expect(created.terms).toBe(uniqueTerms);

    const retrieved = await prisma.case.findUnique({
      where: { id: created.id },
    });

    expect(retrieved).not.toBeNull();
    expect(retrieved?.terms).toBe(uniqueTerms);
  });
})