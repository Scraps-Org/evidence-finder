import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST } from '../../src/app/api/cases/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('POST /api/cases', () => {
  beforeEach(async () => {
    await prisma.case.deleteMany({});
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  it('should create a case with valid identifying terms', async () => {
    const identifyingTerms = `test-case-${Date.now()}`;
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);

    const data = (await response.json()) as { id: string; identifyingTerms: string };
    expect(data.identifyingTerms).toBe(identifyingTerms);

    const savedCase = await prisma.case.findUnique({ where: { id: data.id } });
    expect(savedCase).not.toBeNull();
    expect(savedCase?.identifyingTerms).toBe(identifyingTerms);
  });

  it('should reject empty identifying terms with 400 status', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const count = await prisma.case.count();
    expect(count).toBe(0);
  });

  it('should reject whitespace-only identifying terms with 400 status', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '   \t\n  ' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const count = await prisma.case.count();
    expect(count).toBe(0);
  });
});
