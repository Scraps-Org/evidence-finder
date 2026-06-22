import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GET } from '../../src/app/api/cases/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('GET /api/cases', () => {
  beforeEach(async () => {
    await prisma.case.deleteMany({});
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  it('should return all persisted cases via the API', async () => {
    const terms1 = `get-route-1-${Date.now()}`;
    const terms2 = `get-route-2-${Date.now()}`;
    const case1 = await prisma.case.create({ data: { identifyingTerms: terms1 } });
    const case2 = await prisma.case.create({ data: { identifyingTerms: terms2 } });

    const req = new Request('http://localhost:3000/api/cases', {
      method: 'GET',
      headers: { 'content-type': 'application/json' },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json() as Array<{ id: string; identifyingTerms: string }>;
    expect(Array.isArray(body)).toBe(true);
    expect(body.some((c) => c.id === case1.id && c.identifyingTerms === terms1)).toBe(true);
    expect(body.some((c) => c.id === case2.id && c.identifyingTerms === terms2)).toBe(true);
  });

  it('should return empty array when no cases exist', async () => {
    const req = new Request('http://localhost:3000/api/cases', {
      method: 'GET',
      headers: { 'content-type': 'application/json' },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json() as Array<{ id: string; identifyingTerms: string }>;
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(0);
  });
});