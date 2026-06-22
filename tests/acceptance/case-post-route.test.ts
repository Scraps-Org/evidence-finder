import { POST } from '../../src/app/api/cases/route';
import { PrismaClient } from '@prisma/client';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

const prisma = new PrismaClient();

describe('POST /api/cases', () => {
  beforeEach(async () => {
    await prisma.case.deleteMany();
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  it('creates a case with valid identifying terms', async () => {
    const identifyingTerms = `test-case-${Date.now()}`;
    const req = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const data = await res.json() as { id: string; identifyingTerms: string };
    expect(data.identifyingTerms).toBe(identifyingTerms);

    const saved = await prisma.case.findUnique({ where: { id: data.id } });
    expect(saved).not.toBeNull();
    expect(saved?.identifyingTerms).toBe(identifyingTerms);
  });

  it('rejects empty identifying terms', async () => {
    const req = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '' }),
    });

    const res = await POST(req);
    expect(res.status).toBeGreaterThanOrEqual(400);

    const count = await prisma.case.count();
    expect(count).toBe(0);
  });

  it('rejects whitespace-only identifying terms', async () => {
    const req = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '   \n\t  ' }),
    });

    const res = await POST(req);
    expect(res.status).toBeGreaterThanOrEqual(400);

    const count = await prisma.case.count();
    expect(count).toBe(0);
  });
});
