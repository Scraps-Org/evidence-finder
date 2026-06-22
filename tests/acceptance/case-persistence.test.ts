import { describe, it, expect, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Case Persistence: Prisma Model and Migration', () => {
  afterEach(async () => {
    const createdCases = await prisma.case.findMany({
      where: { identifyingTerms: { contains: 'persistence-test' } },
    });
    for (const testCase of createdCases) {
      await prisma.case.delete({ where: { id: testCase.id } });
    }
    await prisma.$disconnect();
  });

  it('creates and persists a case with identifying terms', async () => {
    const timestamp = Date.now().toString();
    const identifyingTerms = `persistence-test-${timestamp}`;

    const createdCase = await prisma.case.create({
      data: { identifyingTerms },
    });

    expect(createdCase.id).toBeDefined();
    expect(createdCase.identifyingTerms).toBe(identifyingTerms);
    expect(createdCase.createdAt).toBeInstanceOf(Date);

    const retrievedCase = await prisma.case.findUnique({
      where: { id: createdCase.id },
    });

    expect(retrievedCase).not.toBeNull();
    expect(retrievedCase!.identifyingTerms).toBe(identifyingTerms);
    expect(retrievedCase!.id).toBe(createdCase.id);
  });

  it('persists multiple cases and retrieves them', async () => {
    const timestamp = Date.now().toString();
    const case1 = await prisma.case.create({
      data: { identifyingTerms: `persistence-test-case1-${timestamp}` },
    });
    const case2 = await prisma.case.create({
      data: { identifyingTerms: `persistence-test-case2-${timestamp}` },
    });

    const allCases = await prisma.case.findMany({
      where: {
        identifyingTerms: {
          contains: 'persistence-test',
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const ids = allCases.map(c => c.id);
    expect(ids).toContain(case1.id);
    expect(ids).toContain(case2.id);

    await prisma.case.delete({ where: { id: case1.id } });
    await prisma.case.delete({ where: { id: case2.id } });
  });
});
