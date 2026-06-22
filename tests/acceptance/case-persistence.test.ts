import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Case persistence', () => {
  beforeEach(async () => {
    await prisma.case.deleteMany({});
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  it('should persist a case with identifyingTerms to the database', async () => {
    const terms = `test-case-${Date.now()}`;
    const created = await prisma.case.create({
      data: { identifyingTerms: terms },
    });
    expect(created.identifyingTerms).toBe(terms);
    expect(created.id).toBeDefined();

    const found = await prisma.case.findUnique({
      where: { id: created.id },
    });
    expect(found).not.toBeNull();
    expect(found?.identifyingTerms).toBe(terms);
  });

  it('should retrieve multiple cases via findMany', async () => {
    const terms1 = `case-1-${Date.now()}`;
    const terms2 = `case-2-${Date.now()}`;
    await prisma.case.create({ data: { identifyingTerms: terms1 } });
    await prisma.case.create({ data: { identifyingTerms: terms2 } });

    const cases = await prisma.case.findMany({});
    expect(cases.length).toBeGreaterThanOrEqual(2);
    expect(cases.some((c) => c.identifyingTerms === terms1)).toBe(true);
    expect(cases.some((c) => c.identifyingTerms === terms2)).toBe(true);
  });
});