import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { POST } from '../../src/app/api/cases/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('POST /api/cases - Case Creation API Route', () => {
  const testTimestamp = Date.now().toString();

  afterAll(async () => {
    await prisma.case.deleteMany({
      where: {
        identifyingTerms: {
          contains: testTimestamp,
        },
      },
    });
    await prisma.$disconnect();
  });

  it('inserts case with identifying terms into Postgres via Prisma', async () => {
    const req = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: `TestCase-${testTimestamp}` }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = (await res.json()) as { id: string; identifyingTerms: string };
    expect(data.id).toBeDefined();
    expect(data.identifyingTerms).toBe(`TestCase-${testTimestamp}`);

    const saved = await prisma.case.findUnique({ where: { id: data.id } });
    expect(saved).toBeDefined();
    expect(saved?.identifyingTerms).toBe(`TestCase-${testTimestamp}`);
  });

  it('rejects empty identifying terms and returns 400', async () => {
    const req = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const countBefore = await prisma.case.count();
    const req2 = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '' }),
    });
    await POST(req2);
    const countAfter = await prisma.case.count();
    expect(countAfter).toBe(countBefore);
  });

  it('rejects whitespace-only identifying terms and returns 400', async () => {
    const req = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '   \t\n' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
