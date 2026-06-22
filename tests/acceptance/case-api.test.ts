import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST } from '../../src/app/api/cases/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Case API Route (/api/cases POST)', () => {
  afterEach(async () => {
    await prisma.case.deleteMany({});
  });

  it('inserts a new case row into Vercel Postgres via Prisma when valid identifying terms are submitted', async () => {
    const uniqueTerms = `Test Case ${Date.now()}`;
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ terms: uniqueTerms }),
    });

    const response = await POST(request);

    expect(response.status).toBe(201);
    const body = await response.json() as { id?: string; terms?: string };
    expect(body.id).toBeDefined();
    expect(body.terms).toBe(uniqueTerms);

    const saved = await prisma.case.findUnique({
      where: { id: body.id as string },
    });
    expect(saved).not.toBeNull();
    expect(saved?.terms).toBe(uniqueTerms);
  });

  it('rejects empty string input and does not insert a row', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ terms: '' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = await response.json() as { error?: string };
    expect(body.error).toBeDefined();

    const count = await prisma.case.count();
    expect(count).toBe(0);
  });

  it('rejects whitespace-only input and does not insert a row', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ terms: '   ' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = await response.json() as { error?: string };
    expect(body.error).toBeDefined();

    const count = await prisma.case.count();
    expect(count).toBe(0);
  });
})