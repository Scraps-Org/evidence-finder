import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST } from '../../src/app/api/cases/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('POST /api/cases', () => {
  beforeEach(async () => {
    await prisma.case.deleteMany({});
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  it('should insert a case with identifyingTerms into the database', async () => {
    const terms = `post-route-test-${Date.now()}`;
    const req = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      body: JSON.stringify({ identifyingTerms: terms }),
      headers: { 'content-type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json() as { id: string; identifyingTerms: string };
    expect(body.identifyingTerms).toBe(terms);

    const saved = await prisma.case.findUnique({
      where: { id: body.id },
    });
    expect(saved).not.toBeNull();
    expect(saved?.identifyingTerms).toBe(terms);
  });

  it('should reject empty identifyingTerms', async () => {
    const req = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      body: JSON.stringify({ identifyingTerms: '' }),
      headers: { 'content-type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);

    const count = await prisma.case.count();
    expect(count).toBe(0);
  });

  it('should reject whitespace-only identifyingTerms', async () => {
    const req = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      body: JSON.stringify({ identifyingTerms: '   \t\n  ' }),
      headers: { 'content-type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);

    const count = await prisma.case.count();
    expect(count).toBe(0);
  });
});