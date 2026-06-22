import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { POST } from '../../src/app/api/cases/route';

const prisma = new PrismaClient();

describe('POST /api/cases', () => {
  const uniqueId = `test-${Date.now()}`;

  beforeEach(async () => {
    await prisma.case.deleteMany({ where: { identifyingTerms: { contains: uniqueId } } });
  });

  afterEach(async () => {
    await prisma.case.deleteMany({ where: { identifyingTerms: { contains: uniqueId } } });
    await prisma.$disconnect();
  });

  it('creates a case with identifying terms and returns 201', async () => {
    const testTerms = `case-${uniqueId}`;
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: testTerms }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.identifyingTerms).toBe(testTerms);

    const savedCase = await prisma.case.findUnique({
      where: { id: data.id },
    });
    expect(savedCase).not.toBeNull();
    expect(savedCase!.identifyingTerms).toBe(testTerms);
  });

  it('returns 400 when identifyingTerms is empty', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBeDefined();

    const casesInDb = await prisma.case.count({
      where: { identifyingTerms: '' },
    });
    expect(casesInDb).toBe(0);
  });

  it('returns 400 when identifyingTerms is whitespace only', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '   \n\t ' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBeDefined();
  });
});
