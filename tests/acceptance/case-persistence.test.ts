import { describe, it, expect, afterAll, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

afterEach(async () => {
  await prisma.case.deleteMany({
    where: { identifyingTerms: { startsWith: '__test__' } },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Case persistence', () => {
  it('persists a Case row with identifyingTerms and reads it back', async () => {
    const uniqueTerm = `__test__Alice_${Date.now()}`;

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

  it('the case list query returns persisted rows including identifyingTerms', async () => {
    const uniqueTerm = `__test__Bob_${Date.now()}`;

    await prisma.case.create({ data: { identifyingTerms: uniqueTerm } });

    const cases = await prisma.case.findMany({
      where: { identifyingTerms: { startsWith: '__test__' } },
    });

    const match = cases.find((c) => c.identifyingTerms === uniqueTerm);
    expect(match).toBeDefined();
    expect(match!.identifyingTerms).toBe(uniqueTerm);
  });
});
