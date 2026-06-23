import { describe, it, expect, afterAll, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

afterEach(async () => {
  await prisma.case.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Case persistence', () => {
  it('creates a Case row with identifyingTerms and reads it back', async () => {
    const uniqueTerm = `test-term-${Date.now()}`;

    const created = await prisma.case.create({
      data: { identifyingTerms: uniqueTerm },
    });

    expect(created.id).toBeDefined();
    expect(created.identifyingTerms).toBe(uniqueTerm);

    const found = await prisma.case.findFirst({
      where: { id: created.id },
    });

    expect(found).not.toBeNull();
    expect(found!.identifyingTerms).toBe(uniqueTerm);
  });

  it('does not write a row when identifyingTerms is empty', async () => {
    const countBefore = await prisma.case.count();

    try {
      await prisma.case.create({
        data: { identifyingTerms: '' },
      });
    } catch {
      // validation would prevent creation at app layer; this tests the DB round-trip
    }

    const countAfter = await prisma.case.count();
    expect(countAfter).toBe(countBefore);
  });
});
