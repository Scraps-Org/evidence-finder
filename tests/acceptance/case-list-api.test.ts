import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('GET /api/cases (API boundary)', () => {
  const uniqueId = `test-${Date.now()}`;

  beforeEach(async () => {
    await prisma.case.deleteMany({ where: { identifyingTerms: { contains: uniqueId } } });
  });

  afterEach(async () => {
    await prisma.case.deleteMany({ where: { identifyingTerms: { contains: uniqueId } } });
    await prisma.$disconnect();
  });

  it('returns a list of cases via HTTP GET endpoint', async () => {
    const testTerms = `case-${uniqueId}`;
    await prisma.case.create({
      data: { identifyingTerms: testTerms },
    });

    const response = await fetch('http://localhost:3000/api/cases', {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    const data = (await response.json()) as Array<{ identifyingTerms: string }>;
    expect(Array.isArray(data)).toBe(true);
    expect(data.some((c) => c.identifyingTerms === testTerms)).toBe(true);
  });
});
