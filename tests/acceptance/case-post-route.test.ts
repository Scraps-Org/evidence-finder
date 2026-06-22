import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { POST } from '../../src/app/api/cases/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('POST /api/cases - Create Case Route', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await prisma.case.deleteMany({});
  });

  it('creates a case with identifying terms in database', async () => {
    const uniqueId = `test-${Date.now()}`;
    const req = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: uniqueId }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const saved = await prisma.case.findUnique({ where: { identifyingTerms: uniqueId } });
    expect(saved).not.toBeNull();
    expect(saved!.identifyingTerms).toBe(uniqueId);
  });

  it('returns 400 for empty identifying terms', async () => {
    const req = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const count = await prisma.case.count();
    expect(count).toBe(0);
  });

  it('returns 400 for whitespace-only identifying terms', async () => {
    const req = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '   \t\n   ' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const count = await prisma.case.count();
    expect(count).toBe(0);
  });

  it('returns created case data in response', async () => {
    const uniqueId = `test-${Date.now()}`;
    const req = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: uniqueId }),
    });

    const res = await POST(req);
    const data = await res.json() as { identifyingTerms: string; id: string };

    expect(data.identifyingTerms).toBe(uniqueId);
    expect(data.id).toBeDefined();
  });
});
