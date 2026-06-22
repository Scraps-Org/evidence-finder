import { describe, it, expect, afterEach, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Case Persistence (Database)', () => {
  afterEach(async () => {
    await prisma.case.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('creates and retrieves a case from the database', async () => {
    const uniqueId = `test-${Date.now()}`;
    const createdCase = await prisma.case.create({
      data: {
        identifyingTerms: uniqueId,
      },
    });

    expect(createdCase.id).toBeDefined();
    expect(createdCase.identifyingTerms).toBe(uniqueId);

    const retrievedCase = await prisma.case.findUnique({
      where: { id: createdCase.id },
    });

    expect(retrievedCase).not.toBeNull();
    expect(retrievedCase!.identifyingTerms).toBe(uniqueId);
  });

  it('lists all cases from the database', async () => {
    const case1 = await prisma.case.create({
      data: { identifyingTerms: `case-${Date.now()}-1` },
    });
    const case2 = await prisma.case.create({
      data: { identifyingTerms: `case-${Date.now()}-2` },
    });

    const allCases = await prisma.case.findMany({});

    expect(allCases.length).toBeGreaterThanOrEqual(2);
    expect(allCases.some((c) => c.id === case1.id)).toBe(true);
    expect(allCases.some((c) => c.id === case2.id)).toBe(true);
  });
});
