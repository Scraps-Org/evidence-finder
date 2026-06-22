import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GET } from '../../src/app/api/cases/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('GET /api/cases', () => {
  const testId = `case-${Date.now()}`;

  beforeEach(async () => {
    await prisma.case.deleteMany({});
  });

  afterEach(async () => {
    await prisma.case.deleteMany({});
    await prisma.$disconnect();
  });

  it('returns an empty list when no cases exist', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'GET',
    });
    const response = await GET(request);
    expect(response.status).toBe(200);
    const data = await response.json() as { cases: Array<{ id: string; identifyingTerms: string }> };
    expect(data.cases).toEqual([]);
  });

  it('returns all cases in the database', async () => {
    await prisma.case.create({
      data: { identifyingTerms: `${testId}-1` },
    });
    await prisma.case.create({
      data: { identifyingTerms: `${testId}-2` },
    });

    const request = new Request('http://localhost:3000/api/cases', {
      method: 'GET',
    });
    const response = await GET(request);
    expect(response.status).toBe(200);
    const data = await response.json() as { cases: Array<{ id: string; identifyingTerms: string }> };
    expect(data.cases).toHaveLength(2);
    expect(data.cases.map((c) => c.identifyingTerms)).toContain(`${testId}-1`);
    expect(data.cases.map((c) => c.identifyingTerms)).toContain(`${testId}-2`);
  });

  it('returns cases with identifyingTerms field', async () => {
    const terms = `${testId}-terms`;
    await prisma.case.create({
      data: { identifyingTerms: terms },
    });

    const request = new Request('http://localhost:3000/api/cases', {
      method: 'GET',
    });
    const response = await GET(request);
    expect(response.status).toBe(200);
    const data = await response.json() as { cases: Array<{ id: string; identifyingTerms: string }> };
    expect(data.cases[0]!.identifyingTerms).toBe(terms);
  });
}
