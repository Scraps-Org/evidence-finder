import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Case creation end-to-end via API', () => {
  const uniqueId = `test-${Date.now()}`;

  beforeEach(async () => {
    await prisma.case.deleteMany({ where: { identifyingTerms: { contains: uniqueId } } });
  });

  afterEach(async () => {
    await prisma.case.deleteMany({ where: { identifyingTerms: { contains: uniqueId } } });
    await prisma.$disconnect();
  });

  it('creates a case via POST /api/cases and retrieves it via GET /api/cases', async () => {
    const testTerms = `e2e-case-${uniqueId}`;

    const postResponse = await fetch('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: testTerms }),
    });

    expect(postResponse.status).toBe(201);
    const createdCase = (await postResponse.json()) as { id: string; identifyingTerms: string };
    expect(createdCase.id).toBeDefined();
    expect(createdCase.identifyingTerms).toBe(testTerms);

    const getResponse = await fetch('http://localhost:3000/api/cases', {
      method: 'GET',
    });

    expect(getResponse.status).toBe(200);
    const casesList = (await getResponse.json()) as Array<{ identifyingTerms: string }>;

    const foundCase = casesList.find((c) => c.identifyingTerms === testTerms);
    expect(foundCase).toBeDefined();
    expect(foundCase!.identifyingTerms).toBe(testTerms);
  });
});
