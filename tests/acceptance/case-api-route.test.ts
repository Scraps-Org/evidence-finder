import { POST } from '../../src/app/api/cases/route';
import { PrismaClient } from '@prisma/client';
import { describe, it, expect, afterEach, afterAll } from 'vitest';

const prisma = new PrismaClient();

describe('POST /api/cases — D2-case-input', () => {
  const uniquePrefix = Date.now().toString();

  afterEach(async () => {
    await prisma.case.deleteMany({
      where: {
        identifyingTerms: {
          startsWith: uniquePrefix,
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('inserts case with valid non-empty identifying terms into database', async () => {
    const identifyingTerms = `${uniquePrefix}_John Doe`;
    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data).toHaveProperty('id');
    expect(data.identifyingTerms).toBe(identifyingTerms);

    const savedCase = await prisma.case.findUnique({
      where: { id: data.id },
    });
    expect(savedCase).not.toBeNull();
    expect(savedCase!.identifyingTerms).toBe(identifyingTerms);
  });

  it('rejects empty string identifying terms and writes no row', async () => {
    const countBefore = await prisma.case.count();

    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const countAfter = await prisma.case.count();
    expect(countAfter).toBe(countBefore);
  });

  it('rejects whitespace-only identifying terms and writes no row', async () => {
    const countBefore = await prisma.case.count();

    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '   \t\n  ' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const countAfter = await prisma.case.count();
    expect(countAfter).toBe(countBefore);
  });

  it('returns error response on invalid JSON', async () => {
    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'invalid json',
    });

    const res = await POST(req);
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
