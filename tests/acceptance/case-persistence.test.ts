import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

describe('Case Persistence & Migration - D2-case-input', () => {
  beforeEach(async () => {
    await prisma.case.deleteMany();
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  it('Case model exists and can insert/read a row', async () => {
    const identifyingTerms = `persistence-test-${Date.now()}`;

    const created = await prisma.case.create({
      data: { identifyingTerms },
    });

    expect(created.id).toBeDefined();
    expect(created.identifyingTerms).toBe(identifyingTerms);

    const found = await prisma.case.findUnique({
      where: { id: created.id },
    });

    expect(found).not.toBeNull();
    expect(found!.identifyingTerms).toBe(identifyingTerms);
  });

  it('migration file exists for Case table creation', () => {
    const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
    const files = fs.readdirSync(migrationsDir);

    const caseTableMigration = files.find((f) => {
      const migrationPath = path.join(migrationsDir, f, 'migration.sql');
      if (!fs.existsSync(migrationPath)) return false;
      const content = fs.readFileSync(migrationPath, 'utf-8');
      return content.toLowerCase().includes('create table') && content.toLowerCase().includes('case');
    });

    expect(caseTableMigration).toBeDefined();
  });

  it('Case table persists data across queries', async () => {
    const uniqueId = `multi-query-${Date.now()}`;

    const inserted = await prisma.case.create({
      data: { identifyingTerms: uniqueId },
    });

    const queriedById = await prisma.case.findUnique({
      where: { id: inserted.id },
    });
    expect(queriedById!.identifyingTerms).toBe(uniqueId);

    const queriedByTerms = await prisma.case.findMany({
      where: { identifyingTerms: uniqueId },
    });
    expect(queriedByTerms).toHaveLength(1);
    expect(queriedByTerms[0]!.identifyingTerms).toBe(uniqueId);
  });
});
