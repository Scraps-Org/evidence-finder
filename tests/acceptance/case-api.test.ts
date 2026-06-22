import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { POST } from '../../src/app/api/cases/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('D2-case-input: Case API Route', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('inserts a new case row into Vercel Postgres via Prisma on valid request', async () => {
    const terms = `test-case-${Date.now()}`;
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ terms }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body).toMatchObject({ id: expect.any(String), terms });

    const savedCase = await prisma.case.findUnique({
      where: { id: body.id },
    });
    expect(savedCase).toBeDefined();
    expect(savedCase?.terms).toBe(terms);

    await prisma.case.delete({ where: { id: body.id } });
  });

  it('rejects empty terms with 400 error and does not insert', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ terms: '' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  it('rejects whitespace-only terms with 400 error and does not insert', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ terms: '   \t\n  ' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body).toHaveProperty('error');
  });
});
