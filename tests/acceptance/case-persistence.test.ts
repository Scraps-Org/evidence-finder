import { describe, it, expect, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

describe('D2-case-input: Case Persistence & Migration', () => {
  afterEach(async () => {
    await prisma.case.deleteMany({});
  });

  it('should have Case table created by migration', async () => {
    const cases = await prisma.case.findMany();
    expect(Array.isArray(cases)).toBe(true);
  });

  it('should have migration file with Case table creation SQL', () => {
    const migrationPath = path.join(process.cwd(), 'prisma/migrations/0001_init/migration.sql');
    expect(fs.existsSync(migrationPath)).toBe(true);
    const content = fs.readFileSync(migrationPath, 'utf-8');
    expect(content).toContain('CREATE TABLE');
    expect(content).toContain('Case');
    expect(content).toContain('identifyingTerms');
  });

  it('should create and retrieve case with identifying terms', async () => {
    const timestamp = Date.now().toString();
    const createdCase = await prisma.case.create({
      data: {
        identifyingTerms: `Migration Test Case ${timestamp}`,
      },
    });

    expect(createdCase.id).toBeDefined();
    expect(createdCase.identifyingTerms).toBe(`Migration Test Case ${timestamp}`);

    const retrieved = await prisma.case.findUnique({
      where: { id: createdCase.id },
    });

    expect(retrieved).not.toBeNull();
    expect(retrieved!.identifyingTerms).toBe(`Migration Test Case ${timestamp}`);
  });

  it('should persist case data across multiple queries', async () => {
    const identifyingTerms = `Persistent Case ${Date.now()}`;
    const case1 = await prisma.case.create({
      data: { identifyingTerms },
    });

    const case2 = await prisma.case.findMany({
      where: { identifyingTerms },
    });

    expect(case2).toHaveLength(1);
    expect(case2[0]!.id).toBe(case1.id);
  });

  it('should store timestamp for audit trail', async () => {
    const createdCase = await prisma.case.create({
      data: {
        identifyingTerms: `Timestamp Test ${Date.now()}`,
      },
    });

    expect(createdCase.createdAt).toBeDefined();
    expect(createdCase.createdAt instanceof Date).toBe(true);
  });
});
