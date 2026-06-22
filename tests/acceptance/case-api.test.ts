import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST } from '../../src/app/api/cases/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('POST /api/cases (Case Creation API Route)', () => {
  const uniqueId = `test-case-${Date.now()}`;

  afterEach(async () => {
    await prisma.case.deleteMany({
      where: { identifyingTerms: { contains: uniqueId } },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('inserts a new case into the database with valid identifying terms', async () => {
    const identifyingTerms = `John Doe ${uniqueId}`;
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveProperty('id');
    expect(data.identifyingTerms).toBe(identifyingTerms);

    const savedCase = await prisma.case.findUnique({ where: { id: data.id } });
    expect(savedCase).not.toBeNull();
    expect(savedCase?.identifyingTerms).toBe(identifyingTerms);
  });

  it('rejects empty identifying terms with 400 error', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const caseCount = await prisma.case.count({
      where: { identifyingTerms: '' },
    });
    expect(caseCount).toBe(0);
  });

  it('rejects whitespace-only identifying terms with 400 error', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '   ' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const caseCount = await prisma.case.count({
      where: { identifyingTerms: '   ' },
    });
    expect(caseCount).toBe(0);
  });

  it('returns error message for validation failures', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data).toHaveProperty('error');
    expect(typeof data.error).toBe('string');
  });
});

let prismaForCleanup: PrismaClient;

beforeEach(() => {
  prismaForCleanup = new PrismaClient();
});

afterEach(async () => {
  await prismaForCleanup.$disconnect();
});
