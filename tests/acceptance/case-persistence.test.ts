import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('D2-case-input: Case Persistence', () => {
  afterEach(async () => {
    await prisma.case.deleteMany();
    await prisma.$disconnect();
  });

  it('creates and reads back a case via Prisma and Vercel Postgres', async () => {
    const testTerms = `persistence-test-${Date.now()}`;

    const created = await prisma.case.create({
      data: { terms: testTerms }
    });

    expect(created.id).toBeDefined();
    expect(created.terms).toBe(testTerms);

    const found = await prisma.case.findUnique({ where: { id: created.id } });
    expect(found).not.toBeNull();
    expect(found?.terms).toBe(testTerms);
  });

  it('persists case data across multiple queries', async () => {
    const testTerms = `multi-query-${Date.now()}`;

    const created = await prisma.case.create({
      data: { terms: testTerms }
    });

    const allCases = await prisma.case.findMany();
    const found = allCases.find((c) => c.id === created.id);

    expect(found).toBeDefined();
    expect(found?.terms).toBe(testTerms);
  });

  it('stores case with required fields', async () => {
    const testTerms = `required-fields-${Date.now()}`;

    const created = await prisma.case.create({
      data: { terms: testTerms }
    });

    expect(created).toHaveProperty('id');
    expect(created).toHaveProperty('terms');
    expect(created).toHaveProperty('createdAt');
  });
});
