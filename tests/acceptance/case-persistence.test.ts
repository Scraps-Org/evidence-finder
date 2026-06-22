import { describe, it, expect, afterEach, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

describe('D2-case-input: Case persistence', () => {
  afterEach(async () => {
    await prisma.case.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('Case model exists and row can be inserted into database', async () => {
    const uniqueId = `test-case-${Date.now()}`;
    const createdCase = await prisma.case.create({
      data: {
        searchTerms: uniqueId,
      },
    });

    expect(createdCase).toHaveProperty('id');
    expect(createdCase.searchTerms).toBe(uniqueId);

    const fetchedCase = await prisma.case.findUnique({
      where: { id: createdCase.id },
    });

    expect(fetchedCase).not.toBeNull();
    expect(fetchedCase!.searchTerms).toBe(uniqueId);
  });

  it('migration file exists in prisma/migrations', async () => {
    const migrationsDir = path.resolve(process.cwd(), 'prisma/migrations');
    const files = fs.readdirSync(migrationsDir);
    const caseCreationMigration = files.some((f: string) => {
      const migrationFile = path.join(migrationsDir, f, 'migration.sql');
      if (!fs.existsSync(migrationFile)) return false;
      const content = fs.readFileSync(migrationFile, 'utf-8');
      return content.toLowerCase().includes('case') && content.includes('CREATE TABLE');
    });

    expect(caseCreationMigration).toBe(true);
  });
});
