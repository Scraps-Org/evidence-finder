import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST } from '../../src/app/api/cases/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const generateUniqueTerms = () => `test-case-${Date.now()}-${Math.random().toString(36).slice(2)}`;

describe('D2-case-input: Case Creation API Route', () => {
  afterEach(async () => {
    await prisma.$disconnect();
  });

  it('should accept valid identifying terms and insert into database', async () => {
    const terms = generateUniqueTerms();
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ terms }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const data = (await response.json()) as { id?: string; terms?: string };
    expect(data.id).toBeDefined();
    expect(data.terms).toBe(terms);

    const saved = await prisma.case.findUnique({ where: { id: data.id } });
    expect(saved).toBeTruthy();
    expect(saved?.terms).toBe(terms);
  });

  it('should reject empty terms with error response', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ terms: '' }),
    });

    const response = await POST(request);

    expect(response.status).not.toBe(200);
    expect([400, 422]).toContain(response.status);
  });

  it('should reject whitespace-only terms with error response', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ terms: '   ' }),
    });

    const response = await POST(request);

    expect(response.status).not.toBe(200);
    expect([400, 422]).toContain(response.status);
  });

  it('should not insert a row when terms are empty', async () => {
    const termsPrefix = `test-reject-${Date.now()}`;
    const countBefore = await prisma.case.count();

    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ terms: '' }),
    });

    await POST(request);

    const countAfter = await prisma.case.count();
    expect(countAfter).toBe(countBefore);
  });
});
