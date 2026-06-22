import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

describe('D2-case-input: Case persistence and migration', () => {
  afterEach(async () => {
    // Clean up test data
    await prisma.case.deleteMany({});
    await prisma.$disconnect();
  });

  it('Case model exists and can insert/query records', async () => {
    const testIdentifyingTerms = `persist-test-${Date.now()}`;

    const createdCase = await prisma.case.create({
      data: {
        identifyingTerms: testIdentifyingTerms,
      },
    });

    expect(createdCase).toBeDefined();
    expect(createdCase.id).toBeDefined();
    expect(createdCase.identifyingTerms).toBe(testIdentifyingTerms);

    // Verify roundtrip: read it back
    const retrievedCase = await prisma.case.findUnique({
      where: { id: createdCase.id },
    });

    expect(retrievedCase).not.toBeNull();
    expect(retrievedCase?.identifyingTerms).toBe(testIdentifyingTerms);
  });

  it('migration file exists under prisma/migrations/', () => {
    const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
    expect(fs.existsSync(migrationsDir)).toBe(true);

    const files = fs.readdirSync(migrationsDir);
    const hasCaseMigration = files.some((file) => {
      const migrationPath = path.join(migrationsDir, file, 'migration.sql');
      if (!fs.existsSync(migrationPath)) return false;
      const content = fs.readFileSync(migrationPath, 'utf-8');
      return content.toLowerCase().includes('case');
    });

    expect(hasCaseMigration).toBe(true);
  });
});
