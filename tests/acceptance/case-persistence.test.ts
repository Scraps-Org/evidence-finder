import { describe, it, expect, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

describe('D2-case-input: Case Persistence & Migration', () => {
  afterEach(async () => {
    await prisma.case.deleteMany({});
  });

  it('Case table exists in the database created by migration', async () => {
    const testId = `test-case-${Date.now()}`;
    const created = await prisma.case.create({
      data: {
        identifyingTerms: testId,
      },
    });

    expect(created.id).toBeDefined();
    expect(created.identifyingTerms).toBe(testId);

    const retrieved = await prisma.case.findUnique({
      where: { id: created.id },
    });
    expect(retrieved).not.toBeNull();
    expect(retrieved?.identifyingTerms).toBe(testId);
  });

  it('migration file exists under prisma/migrations/ with CREATE TABLE Case', () => {
    const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
    expect(fs.existsSync(migrationsDir)).toBe(true);

    const files = fs.readdirSync(migrationsDir);
    const migrationDirs = files.filter((f) => {
      const fullPath = path.join(migrationsDir, f);
      return fs.statSync(fullPath).isDirectory();
    });

    expect(migrationDirs.length).toBeGreaterThan(0);

    let hasCreateTableCase = false;
    for (const dir of migrationDirs) {
      const sqlPath = path.join(migrationsDir, dir, 'migration.sql');
      if (fs.existsSync(sqlPath)) {
        const content = fs.readFileSync(sqlPath, 'utf-8');
        if (content.toUpperCase().includes('CREATE TABLE') && content.toUpperCase().includes('"Case"')) {
          hasCreateTableCase = true;
          break;
        }
      }
    }

    expect(hasCreateTableCase).toBe(true);
  });

  it('case data round-trips through Prisma and persists in database', async () => {
    const uniqueTerms = `round-trip-${Date.now()}-${Math.random()}`;

    const created = await prisma.case.create({
      data: {
        identifyingTerms: uniqueTerms,
      },
    });

    const fetched = await prisma.case.findUnique({
      where: { id: created.id },
    });

    expect(fetched).not.toBeNull();
    expect(fetched?.identifyingTerms).toBe(uniqueTerms);
    expect(fetched?.id).toBe(created.id);
  });
});
