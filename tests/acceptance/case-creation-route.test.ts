import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BASE_URL = 'http://localhost';

async function postCases(body: unknown): Promise<Response> {
  const { POST } = await import('../../src/app/api/cases/route');
  return POST(
    new Request(`${BASE_URL}/api/cases`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
  );
}

beforeAll(async () => {
  // Clean slate — remove any rows left by previous runs.
  await prisma.case.deleteMany({});
});

beforeEach(async () => {
  await prisma.case.deleteMany({});
});

afterAll(async () => {
  await prisma.case.deleteMany({});
  await prisma.$disconnect();
});

describe('POST /api/cases — case creation route', () => {
  it('persists identifyingTerms as a new Case row for valid input', async () => {
    const term = `test-user-${Date.now()}`;

    const res = await postCases({ identifyingTerms: term });

    expect(res.status).toBe(201);
    const json = await res.json() as { id: string; identifyingTerms: string };
    expect(json.identifyingTerms).toBe(term);

    const row = await prisma.case.findUnique({ where: { id: json.id } });
    expect(row).not.toBeNull();
    expect(row!.identifyingTerms).toBe(term);
  });

  it('rejects empty identifyingTerms with 4xx and writes no row', async () => {
    const countBefore = await prisma.case.count();

    const res = await postCases({ identifyingTerms: '' });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
    const countAfter = await prisma.case.count();
    expect(countAfter).toBe(countBefore);
  });

  it('rejects whitespace-only identifyingTerms with 4xx and writes no row', async () => {
    const countBefore = await prisma.case.count();

    const res = await postCases({ identifyingTerms: '   ' });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
    const countAfter = await prisma.case.count();
    expect(countAfter).toBe(countBefore);
  });
});
