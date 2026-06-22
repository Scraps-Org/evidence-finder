import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GET } from '../../src/app/api/cases/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('GET /api/cases - List Cases Route', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await prisma.case.deleteMany({});
  });

  it('returns empty array when no cases exist', async () => {
    const req = new Request('http://localhost:3000/api/cases', {
      method: 'GET',
    });

    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json() as Array<{ id: string; identifyingTerms: string }>;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
  });

  it('returns saved cases with identifyingTerms', async () => {
    const uniqueId = `test-${Date.now()}`;
    await prisma.case.create({
      data: { identifyingTerms: uniqueId },
    });

    const req = new Request('http://localhost:3000/api/cases', {
      method: 'GET',
    });

    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json() as Array<{ identifyingTerms: string; id: string }>;
    const found = data.find((c) => c.identifyingTerms === uniqueId);
    expect(found).toBeDefined();
    expect(found!.identifyingTerms).toBe(uniqueId);
  });

  it('returns multiple saved cases', async () => {
    const id1 = `test1-${Date.now()}`;
    const id2 = `test2-${Date.now()}`;

    await prisma.case.create({ data: { identifyingTerms: id1 } });
    await prisma.case.create({ data: { identifyingTerms: id2 } });

    const req = new Request('http://localhost:3000/api/cases', {
      method: 'GET',
    });

    const res = await GET(req);
    const data = await res.json() as Array<{ identifyingTerms: string; id: string }>;
    
    expect(data.length).toBeGreaterThanOrEqual(2);
    expect(data.some((c) => c.identifyingTerms === id1)).toBe(true);
    expect(data.some((c) => c.identifyingTerms === id2)).toBe(true);
  });
});
