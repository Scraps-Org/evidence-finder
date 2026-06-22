import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('D2-case-input: Case API Route', () => {
  afterEach(async () => {
    await prisma.case.deleteMany({});
  });

  it('inserts a case row into the database when given valid identifying terms', async () => {
    const { POST } = await import('../../src/app/api/cases/route');

    const testTerms = `test-case-${Date.now()}`;
    const response = await POST(
      new Request('http://localhost:3000/api/cases', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ identifyingTerms: testTerms }),
      }) as Parameters<typeof POST>[0]
    );

    expect(response.status).toBe(200);
    const data = (await response.json()) as { id: string; identifyingTerms: string };
    expect(data.identifyingTerms).toBe(testTerms);

    const saved = await prisma.case.findUnique({
      where: { id: data.id },
    });
    expect(saved).not.toBeNull();
    expect(saved?.identifyingTerms).toBe(testTerms);
  });

  it('rejects empty identifying terms and returns error', async () => {
    const { POST } = await import('../../src/app/api/cases/route');

    const response = await POST(
      new Request('http://localhost:3000/api/cases', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ identifyingTerms: '' }),
      }) as Parameters<typeof POST>[0]
    );

    expect(response.status).toBe(400);

    const count = await prisma.case.count();
    expect(count).toBe(0);
  });

  it('rejects whitespace-only identifying terms and returns error', async () => {
    const { POST } = await import('../../src/app/api/cases/route');

    const response = await POST(
      new Request('http://localhost:3000/api/cases', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ identifyingTerms: '   ' }),
      }) as Parameters<typeof POST>[0]
    );

    expect(response.status).toBe(400);

    const count = await prisma.case.count();
    expect(count).toBe(0);
  });
});
