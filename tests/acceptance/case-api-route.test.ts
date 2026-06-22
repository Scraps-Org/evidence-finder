import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST, GET } from '../../src/app/api/cases/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Case API route (POST /api/cases)', () => {
  const testIdentifier = `test-case-${Date.now()}`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.case.deleteMany({
      where: { identifyingTerms: testIdentifier },
    });
  });

  it('should insert a case with identifying terms into Postgres via Prisma', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: testIdentifier }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const createdCase = await prisma.case.findFirst({
      where: { identifyingTerms: testIdentifier },
    });
    expect(createdCase).not.toBeNull();
    expect(createdCase?.identifyingTerms).toBe(testIdentifier);
  });

  it('should reject empty identifying terms with error response', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '' }),
    });

    const response = await POST(request);
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);

    const allCases = await prisma.case.findMany({
      where: { identifyingTerms: '' },
    });
    expect(allCases).toHaveLength(0);
  });

  it('should reject whitespace-only identifying terms with error response', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '   ' }),
    });

    const response = await POST(request);
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);

    const allCases = await prisma.case.findMany({
      where: { identifyingTerms: '   ' },
    });
    expect(allCases).toHaveLength(0);
  });
});
