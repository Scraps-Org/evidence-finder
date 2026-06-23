import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('POST /api/cases — API route', () => {
  const createdIds: string[] = [];

  afterEach(async () => {
    if (createdIds.length > 0) {
      await prisma.case.deleteMany({ where: { id: { in: createdIds } } });
      createdIds.length = 0;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('creates a Case row with identifyingTerms when valid input is submitted', async () => {
    const { POST } = await import('../../src/app/api/cases/route');
    const uniqueTerm = `test-user-${Date.now()}`;
    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: uniqueTerm }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const body = await res.json() as { id: string; identifyingTerms: string };
    expect(body.identifyingTerms).toBe(uniqueTerm);
    createdIds.push(body.id);

    const row = await prisma.case.findUnique({ where: { id: body.id } });
    expect(row).not.toBeNull();
    expect(row!.identifyingTerms).toBe(uniqueTerm);
  });

  it('returns a non-2xx response and writes no row when identifyingTerms is empty string', async () => {
    const { POST } = await import('../../src/app/api/cases/route');
    const before = await prisma.case.count();

    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '' }),
    });

    const res = await POST(req);
    expect(res.status).toBeGreaterThanOrEqual(400);

    const after = await prisma.case.count();
    expect(after).toBe(before);
  });

  it('returns a non-2xx response and writes no row when identifyingTerms is whitespace only', async () => {
    const { POST } = await import('../../src/app/api/cases/route');
    const before = await prisma.case.count();

    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '   ' }),
    });

    const res = await POST(req);
    expect(res.status).toBeGreaterThanOrEqual(400);

    const after = await prisma.case.count();
    expect(after).toBe(before);
  });
});
