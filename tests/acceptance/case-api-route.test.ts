import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST } from '../../src/app/api/cases/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('POST /api/cases [D2-case-input]', () => {
  afterEach(async () => {
    await prisma.case.deleteMany({});
  });

  it('should insert a case with identifyingTerms into the database on valid submission', async () => {
    const identifyingTerms = `TestCase_${Date.now()}`;
    const req = new Request('http://test/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms }),
    });

    const res = await POST(req as Parameters<typeof POST>[0]);
    expect(res.status).toBe(200);

    const json = await res.json() as { id: string; identifyingTerms: string };
    expect(json.identifyingTerms).toBe(identifyingTerms);

    const saved = await prisma.case.findUnique({ where: { id: json.id } });
    expect(saved).not.toBeNull();
    expect(saved?.identifyingTerms).toBe(identifyingTerms);
  });

  it('should reject empty identifyingTerms with an error', async () => {
    const req = new Request('http://test/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '' }),
    });

    const res = await POST(req as Parameters<typeof POST>[0]);
    expect(res.status).toBe(400);

    const count = await prisma.case.count();
    expect(count).toBe(0);
  });

  it('should reject whitespace-only identifyingTerms with an error', async () => {
    const req = new Request('http://test/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '   ' }),
    });

    const res = await POST(req as Parameters<typeof POST>[0]);
    expect(res.status).toBe(400);

    const count = await prisma.case.count();
    expect(count).toBe(0);
  });
});
