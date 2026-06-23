import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Case API route', () => {
  beforeEach(async () => {
    await prisma.case.deleteMany({});
  });

  afterEach(async () => {
    await prisma.case.deleteMany({});
    await prisma.$disconnect();
  });

  it('should insert a case with identifyingTerms into the database when valid data is submitted', async () => {
    const { POST } = await import('../../src/app/api/cases/route');

    const identifyingTerms = `test-case-${Date.now()}`;
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifyingTerms }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);

    const data = await response.json() as { id: string; identifyingTerms: string };
    expect(data.identifyingTerms).toBe(identifyingTerms);

    const savedCase = await prisma.case.findUnique({
      where: { id: data.id },
    });
    expect(savedCase).not.toBeNull();
    expect(savedCase?.identifyingTerms).toBe(identifyingTerms);
  });

  it('should reject empty identifyingTerms and not insert a row', async () => {
    const { POST } = await import('../../src/app/api/cases/route');

    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const count = await prisma.case.count();
    expect(count).toBe(0);
  });

  it('should reject whitespace-only identifyingTerms and not insert a row', async () => {
    const { POST } = await import('../../src/app/api/cases/route');

    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '   ' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const count = await prisma.case.count();
    expect(count).toBe(0);
  });
});
