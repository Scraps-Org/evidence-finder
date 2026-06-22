import { describe, it, expect, afterEach, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Case Persistence - Prisma & Vercel Postgres', () => {
  const createdCaseIds: string[] = [];

  afterEach(async () => {
    // Clean up test data
    if (createdCaseIds.length > 0) {
      await prisma.case.deleteMany({
        where: {
          id: { in: createdCaseIds },
        },
      });
      createdCaseIds.length = 0;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('creates and retrieves a case with identifying terms from the database', async () => {
    const timestamp = Date.now();
    const identifyingTerms = `persist-test-${timestamp}`;

    const createdCase = await prisma.case.create({
      data: {
        identifyingTerms,
      },
    });
    createdCaseIds.push(createdCase.id);

    expect(createdCase.id).toBeDefined();
    expect(createdCase.identifyingTerms).toBe(identifyingTerms);

    const retrievedCase = await prisma.case.findUnique({
      where: { id: createdCase.id },
    });

    expect(retrievedCase).toBeDefined();
    expect(retrievedCase!.identifyingTerms).toBe(identifyingTerms);
  });

  it('lists cases including the newly created case', async () => {
    const timestamp = Date.now();
    const identifyingTerms = `persist-test-${timestamp}`;

    const createdCase = await prisma.case.create({
      data: {
        identifyingTerms,
      },
    });
    createdCaseIds.push(createdCase.id);

    const cases = await prisma.case.findMany();

    const foundCase = cases.find((c) => c.id === createdCase.id);
    expect(foundCase).toBeDefined();
    expect(foundCase!.identifyingTerms).toBe(identifyingTerms);
  });
});
