import { describe, it, expect, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Case Persistence & Migration (Prisma Schema & DB)', () => {
  const uniqueTestId = `persistence-test-${Date.now()}`;

  afterEach(async () => {
    await prisma.case.deleteMany({
      where: { identifyingTerms: { contains: uniqueTestId } },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('creates a Case row and reads it back with all fields', async () => {
    const identifyingTerms = `Test Case ${uniqueTestId}`;

    const createdCase = await prisma.case.create({
      data: { identifyingTerms },
    });

    expect(createdCase).toBeDefined();
    expect(createdCase.id).toBeDefined();
    expect(createdCase.identifyingTerms).toBe(identifyingTerms);
    expect(createdCase.createdAt).toBeInstanceOf(Date);

    const fetchedCase = await prisma.case.findUnique({
      where: { id: createdCase.id },
    });

    expect(fetchedCase).not.toBeNull();
    expect(fetchedCase?.identifyingTerms).toBe(identifyingTerms);
    expect(fetchedCase?.id).toBe(createdCase.id);
  });

  it('persists multiple cases and queries them', async () => {
    const case1 = await prisma.case.create({
      data: { identifyingTerms: `Case One ${uniqueTestId}` },
    });

    const case2 = await prisma.case.create({
      data: { identifyingTerms: `Case Two ${uniqueTestId}` },
    });

    const allCases = await prisma.case.findMany({
      where: { identifyingTerms: { contains: uniqueTestId } },
    });

    expect(allCases.length).toBe(2);
    expect(allCases.map((c) => c.id)).toContain(case1.id);
    expect(allCases.map((c) => c.id)).toContain(case2.id);
  });

  it('Case model exists with required fields', async () => {
    const schema = (await prisma.$queryRaw`
      SELECT column_name, data_type FROM information_schema.columns
      WHERE table_name = 'Case'
      ORDER BY ordinal_position;
    ` as Array<{ column_name: string; data_type: string }>);

    const columns = schema.map((col) => col.column_name);
    expect(columns).toContain('id');
    expect(columns).toContain('identifyingTerms');
    expect(columns).toContain('createdAt');
  });
});

let prismaForCleanup: PrismaClient;

afterEach(() => {
  prismaForCleanup = new PrismaClient();
});
