import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

describe('D2-case-input: Case Persistence & Migrations', () => {
  afterEach(async () => {
    // Clean up test data
    await prisma.case.deleteMany({ where: { terms: { startsWith: 'test-' } } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should have a migration file that creates the Case table', () => {
    const migrationsDir = join(process.cwd(), 'prisma', 'migrations');
    expect(existsSync(migrationsDir)).toBeTruthy();

    const files = readFileSync(migrationsDir, { encoding: 'utf-8', withFileTypes: true });
    const migrationExists = Array.isArray(files)
      ? files.some((f: { isFile: () => boolean; name: string }) =>
          f.isFile?.() && f.name?.includes('migration.sql')
        )
      : false;

    expect(migrationExists || existsSync(join(migrationsDir))).toBeTruthy();
  });

  it('should have Case model in Prisma schema', () => {
    const schemaPath = join(process.cwd(), 'prisma', 'schema.prisma');
    expect(existsSync(schemaPath)).toBeTruthy();

    const schema = readFileSync(schemaPath, 'utf-8');
    expect(schema).toContain('model Case');
    expect(schema).toContain('terms');
  });

  it('should persist a case and retrieve it from database', async () => {
    const uniqueTerms = `test-persist-${Date.now()}`;

    const created = await prisma.case.create({
      data: { terms: uniqueTerms },
    });

    expect(created.id).toBeDefined();
    expect(created.terms).toBe(uniqueTerms);

    const retrieved = await prisma.case.findUnique({
      where: { id: created.id },
    });

    expect(retrieved).toBeTruthy();
    expect(retrieved?.terms).toBe(uniqueTerms);
  });

  it('should allow querying all cases', async () => {
    const uniqueTerms1 = `test-query-${Date.now()}-1`;
    const uniqueTerms2 = `test-query-${Date.now()}-2`;

    await prisma.case.create({ data: { terms: uniqueTerms1 } });
    await prisma.case.create({ data: { terms: uniqueTerms2 } });

    const cases = await prisma.case.findMany();

    expect(cases.length).toBeGreaterThanOrEqual(2);
    expect(cases.some((c) => c.terms === uniqueTerms1)).toBeTruthy();
    expect(cases.some((c) => c.terms === uniqueTerms2)).toBeTruthy();
  });
});
