import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GET, POST } from '../../src/app/api/cases/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('GET /api/cases', () => {
  beforeEach(async () => {
    await prisma.case.deleteMany({});
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  it('should return empty list when no cases exist', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'GET',
    });

    const response = await GET(request);
    expect(response.status).toBe(200);

    const data = (await response.json()) as { cases: Array<{ id: string; identifyingTerms: string }> };
    expect(data.cases).toEqual([]);
  });

  it('should return created case in list after creation', async () => {
    const identifyingTerms = `test-case-${Date.now()}`;
    const postRequest = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms }),
    });

    const postResponse = await POST(postRequest);
    expect(postResponse.status).toBe(201);

    const getRequest = new Request('http://localhost:3000/api/cases', {
      method: 'GET',
    });

    const getResponse = await GET(getRequest);
    expect(getResponse.status).toBe(200);

    const data = (await getResponse.json()) as { cases: Array<{ id: string; identifyingTerms: string }> };
    expect(data.cases).toHaveLength(1);
    expect(data.cases[0]!.identifyingTerms).toBe(identifyingTerms);
  });

  it('should return multiple cases in list', async () => {
    const terms1 = `case-${Date.now()}-1`;
    const terms2 = `case-${Date.now()}-2`;

    const req1 = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: terms1 }),
    });
    await POST(req1);

    const req2 = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: terms2 }),
    });
    await POST(req2);

    const getRequest = new Request('http://localhost:3000/api/cases', {
      method: 'GET',
    });

    const getResponse = await GET(getRequest);
    expect(getResponse.status).toBe(200);

    const data = (await getResponse.json()) as { cases: Array<{ id: string; identifyingTerms: string }> };
    expect(data.cases).toHaveLength(2);
    const terms = data.cases.map((c) => c.identifyingTerms);
    expect(terms).toContain(terms1);
    expect(terms).toContain(terms2);
  });
});
