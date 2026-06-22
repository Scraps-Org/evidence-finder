import { GET, POST } from '../../src/app/api/cases/route';
import { PrismaClient } from '@prisma/client';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

const prisma = new PrismaClient();

describe('GET /api/cases', () => {
  beforeEach(async () => {
    await prisma.case.deleteMany();
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  it('returns empty list when no cases exist', async () => {
    const req = new Request('http://localhost:3000/api/cases', {
      method: 'GET',
    });

    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json() as Array<{ id: string; identifyingTerms: string }>;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
  });

  it('returns created cases after POST', async () => {
    const identifyingTerms = `case-${Date.now()}`;

    const postReq = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms }),
    });

    const postRes = await POST(postReq);
    expect(postRes.status).toBe(201);

    const getReq = new Request('http://localhost:3000/api/cases', {
      method: 'GET',
    });

    const getRes = await GET(getReq);
    expect(getRes.status).toBe(200);

    const cases = await getRes.json() as Array<{ id: string; identifyingTerms: string }>;
    expect(cases.length).toBeGreaterThan(0);
    expect(cases.some(c => c.identifyingTerms === identifyingTerms)).toBe(true);
  });
});
