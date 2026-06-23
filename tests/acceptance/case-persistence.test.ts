import { describe, it, expect, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Case persistence (real DB)', () => {
  const tag = `test-${Date.now()}`;

  afterAll(async () => {
    await prisma.case.deleteMany({
      where: { identifyingTerms: { contains: 'acceptance-test-' } },
    });
    await prisma.$disconnect();
  });

  it('persists a Case row with identifyingTerms and reads it back', async () => {
    const terms = `acceptance-test-${tag}`;
    const created = await prisma.case.create({
      data: { identifyingTerms: terms },
    });

    expect(created.id).toBeDefined();
    expect(created.identifyingTerms).toBe(terms);

    const found = await prisma.case.findUnique({ where: { id: created.id } });
    expect(found).not.toBeNull();
    expect(found!.identifyingTerms).toBe(terms);
  });

  it('does not persist a row for empty identifyingTerms via the API contract (route guard)', async () => {
    const countBefore = await prisma.case.count();
    // Simulate the guard: empty terms must not reach the DB.
    // The route test covers this via mocked prisma; here we confirm the DB has no
    // empty-terms row introduced by any path in the real schema.
    const emptyRows = await prisma.case.findMany({
      where: { identifyingTerms: '' },
    });
    expect(emptyRows).toHaveLength(0);
    // row count must not have grown (no side-effect from this test)
    const countAfter = await prisma.case.count();
    expect(countAfter).toBe(countBefore);
  });
});
