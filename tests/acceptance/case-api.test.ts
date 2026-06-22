import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { POST } from '../../src/app/api/cases/route';

const prisma = new PrismaClient();

describe('D2-case-input: Case API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  it('accepts valid identifying terms and inserts into Case table', async () => {
    const testTerms = `test-case-${Date.now()}`;
    const body = JSON.stringify({ terms: testTerms });
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json() as { id: string; terms: string };
    expect(data.terms).toBe(testTerms);

    const saved = await prisma.case.findUnique({ where: { id: data.id } });
    expect(saved).not.toBeNull();
    expect(saved?.terms).toBe(testTerms);
  });

  it('rejects empty terms with 400 error', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ terms: '' })
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('rejects whitespace-only terms with 400 error', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ terms: '   ' })
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('does not insert a row when validation fails', async () => {
    const countBefore = await prisma.case.count();

    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ terms: '' })
    });

    await POST(request);
    const countAfter = await prisma.case.count();

    expect(countAfter).toBe(countBefore);
  });
});
