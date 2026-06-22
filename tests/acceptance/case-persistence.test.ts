import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Case Persistence: Database Operations', () => {
  beforeEach(async () => {
    await prisma.case.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create and retrieve a case from the database', async () => {
    const identifyingTerms = `Persistence Test ${Date.now()}`;

    const createdCase = await prisma.case.create({
      data: {
        identifyingTerms,
      },
    });

    expect(createdCase.id).toBeDefined();
    expect(createdCase.identifyingTerms).toBe(identifyingTerms);

    const retrievedCase = await prisma.case.findUnique({
      where: { id: createdCase.id },
    });

    expect(retrievedCase).not.toBeNull();
    expect(retrievedCase?.identifyingTerms).toBe(identifyingTerms);
  });

  it('should retrieve all cases', async () => {
    const terms1 = `Case 1 ${Date.now()}`;
    const terms2 = `Case 2 ${Date.now()}`;

    await prisma.case.create({ data: { identifyingTerms: terms1 } });
    await prisma.case.create({ data: { identifyingTerms: terms2 } });

    const cases = await prisma.case.findMany();

    expect(cases.length).toBeGreaterThanOrEqual(2);
    expect(cases.some((c) => c.identifyingTerms === terms1)).toBe(true);
    expect(cases.some((c) => c.identifyingTerms === terms2)).toBe(true);
  });

  it('should persist case data across queries', async () => {
    const identifyingTerms = `Roundtrip Test ${Date.now()}`;

    const created = await prisma.case.create({
      data: { identifyingTerms },
    });

    const found = await prisma.case.findUnique({
      where: { id: created.id },
    });

    expect(found?.identifyingTerms).toBe(identifyingTerms);
    expect(found?.id).toBe(created.id);
  });
});
