import { describe, it, expect, afterEach, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Case Persistence (Prisma & Postgres)', () => {
  const testId = `persist-${Date.now()}`;

  afterEach(async () => {
    await prisma.case.deleteMany({
      where: { searchTerm: { contains: testId } },
    });
  });

  describe('D2-case-input: Prisma schema and migration create Case table', () => {
    it('inserts and retrieves case from Postgres via Prisma', async () => {
      const searchTerm = `Persist Case ${testId}`;

      const createdCase = await prisma.case.create({
        data: { searchTerm },
      });

      expect(createdCase).toHaveProperty('id');
      expect(createdCase.searchTerm).toBe(searchTerm);

      const retrievedCase = await prisma.case.findUnique({
        where: { id: createdCase.id },
      });

      expect(retrievedCase).not.toBeNull();
      expect(retrievedCase?.searchTerm).toBe(searchTerm);
    });

    it('creates multiple cases and lists them all', async () => {
      const case1 = await prisma.case.create({
        data: { searchTerm: `Case 1 ${testId}` },
      });
      const case2 = await prisma.case.create({
        data: { searchTerm: `Case 2 ${testId}` },
      });

      const cases = await prisma.case.findMany({
        where: { searchTerm: { contains: testId } },
        orderBy: { createdAt: 'asc' },
      });

      expect(cases).toHaveLength(2);
      expect(cases[0]!.id).toBe(case1.id);
      expect(cases[1]!.id).toBe(case2.id);
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
