import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

describe('D2-case-input: Case Persistence & Migration', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('Prisma schema defines Case model', async () => {
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    expect(schema).toContain('model Case');
    expect(schema).toContain('id');
    expect(schema).toContain('terms');
  });

  it('migration file exists to create Case table', async () => {
    const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
    const migrations = fs.readdirSync(migrationsDir).filter(f => {
      const fullPath = path.join(migrationsDir, f);
      return fs.statSync(fullPath).isDirectory();
    });
    const caseCreateMigration = migrations.find(m => {
      const migrationFile = path.join(migrationsDir, m, 'migration.sql');
      if (!fs.existsSync(migrationFile)) return false;
      const sql = fs.readFileSync(migrationFile, 'utf-8').toUpperCase();
      return sql.includes('CREATE TABLE') && sql.includes('CASE');
    });
    expect(caseCreateMigration).toBeDefined();
  });

  it('Case table exists and accepts rows via Prisma', async () => {
    const terms = `persistence-test-${Date.now()}`;
    const createdCase = await prisma.case.create({
      data: { terms },
    });
    expect(createdCase.id).toBeDefined();
    expect(createdCase.terms).toBe(terms);

    const found = await prisma.case.findUnique({
      where: { id: createdCase.id },
    });
    expect(found).toBeDefined();
    expect(found?.terms).toBe(terms);

    await prisma.case.delete({ where: { id: createdCase.id } });
  });
});
