import { describe, it, expect, afterEach } from 'vitest';
import { POST } from '../../src/app/api/cases/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const testId = `api-val-${Date.now()}`;

describe('POST /api/cases validation', () => {
  afterEach(async () => {
    await prisma.case.deleteMany({
      where: { identifyingTerms: { contains: testId } },
    });
    await prisma.$disconnect();
  });

  it('rejects empty identifyingTerms with 4xx error', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      body: JSON.stringify({ identifyingTerms: '' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);

    const dbCount = await prisma.case.count();
    expect(dbCount).toBe(0);
  });

  it('rejects whitespace-only identifyingTerms with 4xx error', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      body: JSON.stringify({ identifyingTerms: '   \t\n' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);

    const dbCount = await prisma.case.count();
    expect(dbCount).toBe(0);
  });

  it('successfully creates a case with valid identifyingTerms', async () => {
    const terms = `${testId}-valid`;
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      body: JSON.stringify({ identifyingTerms: terms }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(201);

    const dbCase = await prisma.case.findFirst({
      where: { identifyingTerms: terms },
    });
    expect(dbCase).not.toBeNull();
    expect(dbCase?.identifyingTerms).toBe(terms);
  });
}
