import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Case Persistence - Migration & Schema (D2-case-input)', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterEach(async () => {
    await prisma.case.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('Case table exists via migration and schema is correctly applied', async () => {
    const timestamp = Date.now();
    const testSearchTerms = `Test Case ${timestamp}`;

    const created = await prisma.case.create({
      data: { searchTerms: testSearchTerms }
    });

    expect(created.id).toBeDefined();
    expect(created.searchTerms).toBe(testSearchTerms);
    expect(created.createdAt).toBeDefined();

    const retrieved = await prisma.case.findUnique({
      where: { id: created.id }
    });
    expect(retrieved).not.toBeNull();
    expect(retrieved?.searchTerms).toBe(testSearchTerms);
  });
});
