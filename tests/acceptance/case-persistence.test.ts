import { describe, it, expect, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Case Persistence (Prisma Schema & Migration)', () => {
  const testId = `persist-${Date.now()}`;

  it('creates a Case table via migration and persists data', async () => {
    const searchTerms = `Test Case ${testId}`;

    const created = await prisma.case.create({
      data: { searchTerms },
    });

    expect(created.id).toBeDefined();
    expect(created.searchTerms).toBe(searchTerms);

    const found = await prisma.case.findUnique({ where: { id: created.id } });
    expect(found).not.toBeNull();
    expect(found!.searchTerms).toBe(searchTerms);
  });

  it('lists all cases from the database', async () => {
    const searchTerms = `List Case ${testId}`;

    await prisma.case.create({ data: { searchTerms } });

    const allCases = await prisma.case.findMany();
    expect(allCases.length).toBeGreaterThan(0);
    expect(allCases.some((c) => c.searchTerms === searchTerms)).toBe(true);
  });

  afterEach(async () => {
    await prisma.case.deleteMany({
      where: { searchTerms: { contains: testId } },
    });
    await prisma.$disconnect();
  });
});
