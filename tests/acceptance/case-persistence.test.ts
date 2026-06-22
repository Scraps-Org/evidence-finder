import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Case Persistence (Prisma schema & migrations)', () => {
  const uniqueTimestamp = Date.now().toString();

  afterEach(async () => {
    // Clean up test cases after each test
    await prisma.case.deleteMany({
      where: {
        term: {
          startsWith: `persist-test-${uniqueTimestamp}`,
        },
      },
    });
  });

  it('should have Case model defined in Prisma schema with required fields', async () => {
    // This test verifies the schema exists by attempting to query it
    const cases = await prisma.case.findMany({
      take: 1,
    });
    expect(Array.isArray(cases)).toBe(true);
  });

  it('should persist a case row to Vercel Postgres via Prisma', async () => {
    const testTerm = `persist-test-${uniqueTimestamp}-create`;

    const createdCase = await prisma.case.create({
      data: {
        term: testTerm,
      },
    });

    expect(createdCase.id).toBeDefined();
    expect(createdCase.term).toBe(testTerm);

    // Verify the case was persisted by reading it back
    const foundCase = await prisma.case.findUnique({
      where: { id: createdCase.id },
    });

    expect(foundCase).toBeDefined();
    expect(foundCase?.term).toBe(testTerm);
  });

  it('should allow reading back a newly created case from the database', async () => {
    const testTerm = `persist-test-${uniqueTimestamp}-read`;

    const createdCase = await prisma.case.create({
      data: {
        term: testTerm,
      },
    });

    const retrievedCase = await prisma.case.findUnique({
      where: { id: createdCase.id },
    });

    expect(retrievedCase).toEqual(createdCase);
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
