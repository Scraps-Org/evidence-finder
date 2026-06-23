import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { POST } from '../../src/app/api/cases/route';

const prisma = new PrismaClient();

beforeEach(async () => {
  await prisma.case.deleteMany();
});

afterEach(async () => {
  await prisma.case.deleteMany();
  await prisma.$disconnect();
});

describe('POST /api/cases', () => {
  it('creates a Case row with identifyingTerms when valid input is submitted', async () => {
    const terms = `test-terms-${Date.now()}`;
    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: terms }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const body = await res.json() as { id: string; identifyingTerms: string };
    expect(body.identifyingTerms).toBe(terms);

    const row = await prisma.case.findUnique({ where: { id: body.id } });
    expect(row).not.toBeNull();
    expect(row?.identifyingTerms).toBe(terms);
  });

  it('returns a non-2xx response and writes no row when input is an empty string', async () => {
    const before = await prisma.case.count();
    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '' }),
    });

    const res = await POST(req);
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(600);

    const after = await prisma.case.count();
    expect(after).toBe(before);
  });

  it('returns a non-2xx response and writes no row when input is whitespace-only', async () => {
    const before = await prisma.case.count();
    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '   ' }),
    });

    const res = await POST(req);
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(600);

    const after = await prisma.case.count();
    expect(after).toBe(before);
  });
});
