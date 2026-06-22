import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST } from '../../src/app/api/cases/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('POST /api/cases (Case API Route)', () => {
  const testId = `test-${Date.now()}`;

  afterEach(async () => {
    await prisma.case.deleteMany({
      where: { searchTerms: { contains: testId } },
    });
  });

  it('inserts a new case into the database via Prisma', async () => {
    const searchTerms = `Case ${testId}`;
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      body: JSON.stringify({ searchTerms }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(201);

    const data = await response.json() as { id: string; searchTerms: string };
    expect(data.searchTerms).toBe(searchTerms);

    const saved = await prisma.case.findUnique({ where: { id: data.id } });
    expect(saved).not.toBeNull();
    expect(saved!.searchTerms).toBe(searchTerms);
  });

  it('rejects empty searchTerms with a 400 error', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      body: JSON.stringify({ searchTerms: '' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('rejects whitespace-only searchTerms with a 400 error', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      body: JSON.stringify({ searchTerms: '   ' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });
});
