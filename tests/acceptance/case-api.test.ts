import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST } from '../../src/app/api/cases/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('D2-case-input: Case API route', () => {
  const testId = `test-${Date.now()}`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await prisma.case.deleteMany({
      where: { terms: { contains: testId } },
    });
  });

  it('receives case creation request and inserts a row into the Case table', async () => {
    const terms = `John Doe ${testId}`;
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ terms }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);

    const data = await response.json() as { id: string; terms: string };
    expect(data.terms).toBe(terms);

    const saved = await prisma.case.findUnique({ where: { id: data.id } });
    expect(saved).not.toBeNull();
    expect(saved?.terms).toBe(terms);
  });

  it('rejects empty terms string', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ terms: '' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const count = await prisma.case.count({
      where: { terms: '' },
    });
    expect(count).toBe(0);
  });

  it('rejects whitespace-only terms', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ terms: '   ' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
