import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST } from '../../src/app/api/cases/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Case API Route - Persistence (D2-case-input)', () => {
  beforeEach(async () => {
    await prisma.case.deleteMany({});
  });

  afterEach(async () => {
    await prisma.case.deleteMany({});
    await prisma.$disconnect();
  });

  it('inserts a new case row in Vercel Postgres via Prisma when valid searchTerms are submitted', async () => {
    const req = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ searchTerms: 'Jane Smith' })
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const data = await res.json() as { id: string; searchTerms: string };
    expect(data.searchTerms).toBe('Jane Smith');
    expect(data.id).toBeDefined();

    const savedCase = await prisma.case.findUnique({
      where: { id: data.id }
    });
    expect(savedCase).not.toBeNull();
    expect(savedCase?.searchTerms).toBe('Jane Smith');
  });

  it('rejects empty searchTerms and writes no row', async () => {
    const req = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ searchTerms: '' })
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const count = await prisma.case.count();
    expect(count).toBe(0);
  });

  it('rejects whitespace-only searchTerms and writes no row', async () => {
    const req = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ searchTerms: '   ' })
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const count = await prisma.case.count();
    expect(count).toBe(0);
  });
});
