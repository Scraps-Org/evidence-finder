import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('D2-case-input: Case Persistence & Migration', () => {
  afterEach(async () => {
    await prisma.case.deleteMany();
  });

  it('Case table exists via Prisma migration', async () => {
    const result = await prisma.case.findMany();
    expect(Array.isArray(result)).toBe(true);
  });

  it('creates and retrieves a case row from Vercel Postgres', async () => {
    const timestamp = new Date().toISOString();
    const caseData = await prisma.case.create({
      data: {
        searchTerms: `Case-${timestamp}`,
      },
    });

    expect(caseData.id).toBeDefined();
    expect(caseData.searchTerms).toBe(`Case-${timestamp}`);

    const retrieved = await prisma.case.findUnique({
      where: { id: caseData.id },
    });

    expect(retrieved).not.toBeNull();
    expect(retrieved!.searchTerms).toBe(`Case-${timestamp}`);
  });

  it('persists multiple cases independently', async () => {
    const timestamp = new Date().toISOString();

    const case1 = await prisma.case.create({
      data: { searchTerms: `Case1-${timestamp}` },
    });
    const case2 = await prisma.case.create({
      data: { searchTerms: `Case2-${timestamp}` },
    });

    const all = await prisma.case.findMany();
    const ids = all.map((c) => c.id).sort();
    expect(ids).toContain(case1.id);
    expect(ids).toContain(case2.id);
  });
});