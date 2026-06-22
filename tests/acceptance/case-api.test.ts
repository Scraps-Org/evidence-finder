import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST } from '../../src/app/api/cases/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Case API Route (POST /api/cases)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    const timestamp = new Date().toISOString();
    await prisma.case.deleteMany({
      where: {
        identifyingTerms: {
          contains: timestamp,
        },
      },
    });
  });

  it('inserts a Case row when valid identifying terms are submitted', async () => {
    const testId = new Date().toISOString();
    const req = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: `Test Case ${testId}` }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.id).toBeDefined();
    expect(data.identifyingTerms).toBe(`Test Case ${testId}`);

    const savedCase = await prisma.case.findUnique({ where: { id: data.id } });
    expect(savedCase).not.toBeNull();
    expect(savedCase?.identifyingTerms).toBe(`Test Case ${testId}`);
  });

  it('rejects empty string and returns 400 without inserting a row', async () => {
    const req = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toBeDefined();

    const count = await prisma.case.count();
    expect(count).toBe(0);
  });

  it('rejects whitespace-only input and returns 400 without inserting a row', async () => {
    const req = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '   \t\n  ' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toBeDefined();

    const count = await prisma.case.count();
    expect(count).toBe(0);
  });
});
