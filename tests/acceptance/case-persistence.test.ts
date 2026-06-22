import { describe, it, expect, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

describe('D2-case-input: Persistence & Migration', () => {
  const testId = `persist-${Date.now()}`;

  afterEach(async () => {
    await prisma.case.deleteMany({
      where: { terms: { contains: testId } },
    });
    await prisma.$disconnect();
  });

  it('Case table exists and can store and retrieve identifying terms', async () => {
    const terms = `Test Case ${testId}`;

    const created = await prisma.case.create({
      data: { terms },
    });

    expect(created.id).toBeDefined();
    expect(created.terms).toBe(terms);

    const retrieved = await prisma.case.findUnique({
      where: { id: created.id },
    });

    expect(retrieved).not.toBeNull();
    expect(retrieved?.terms).toBe(terms);
  });

  it('migration file exists in prisma/migrations/', () => {
    const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
    expect(fs.existsSync(migrationsDir)).toBe(true);

    const files = fs.readdirSync(migrationsDir);
    const hasCaseMigration = files.some((file) => {
      const migrationPath = path.join(migrationsDir, file, 'migration.sql');
      if (!fs.existsSync(migrationPath)) return false;
      const content = fs.readFileSync(migrationPath, 'utf-8');
      return content.includes('CREATE TABLE') && content.toLowerCase().includes('case');
    });

    expect(hasCaseMigration).toBe(true);
  });
});
