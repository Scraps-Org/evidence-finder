import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST, GET } from '../../src/app/api/cases/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Case list API (GET /api/cases)', () => {
  const testIdentifier = `list-test-${Date.now()}`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await prisma.case.deleteMany({
      where: { identifyingTerms: testIdentifier },
    });
    await prisma.$disconnect();
  });

  it('should return the newly saved case in the list via GET', async () => {
    // Create a case via POST
    const createRequest = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: testIdentifier }),
    });
    const createResponse = await POST(createRequest);
    expect(createResponse.status).toBe(200);

    // Retrieve cases via GET
    const getRequest = new Request('http://localhost:3000/api/cases', {
      method: 'GET',
    });
    const getResponse = await GET(getRequest);
    expect(getResponse.status).toBe(200);

    const cases = await getResponse.json();
    expect(Array.isArray(cases)).toBe(true);

    const foundCase = cases.find(
      (c: { identifyingTerms: string }) => c.identifyingTerms === testIdentifier
    );
    expect(foundCase).toBeDefined();
    expect(foundCase?.identifyingTerms).toBe(testIdentifier);
  });
});
