import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { GET } from '../../src/app/api/cases/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('GET /api/cases - Case List API Route', () => {
  const testTimestamp = Date.now().toString();
  let createdCaseId: string;

  beforeAll(async () => {
    const created = await prisma.case.create({
      data: { identifyingTerms: `ListTest-${testTimestamp}` },
    });
    createdCaseId = created.id;
  });

  afterAll(async () => {
    await prisma.case.delete({ where: { id: createdCaseId } });
    await prisma.$disconnect();
  });

  it('returns all cases from database including the created case', async () => {
    const req = new Request('http://localhost:3000/api/cases', { method: 'GET' });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = (await res.json()) as Array<{ id: string; identifyingTerms: string }>;    expect(Array.isArray(data)).toBe(true);
    const foundCase = data.find((c) => c.id === createdCaseId);
    expect(foundCase).toBeDefined();
    expect(foundCase?.identifyingTerms).toBe(`ListTest-${testTimestamp}`);
  });
});
