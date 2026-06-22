import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { POST } from '../../src/app/api/cases/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('D2-case-input: API route POST /api/cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  it('inserts a new case with identifying terms into the database', async () => {
    const testIdentifyingTerms = `test-case-${Date.now()}`;
    const requestBody = JSON.stringify({ identifyingTerms: testIdentifyingTerms });

    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      body: requestBody,
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(201);

    const data = await response.json() as { id: string; identifyingTerms: string };
    expect(data.identifyingTerms).toBe(testIdentifyingTerms);
    expect(data.id).toBeDefined();

    // Verify the case was actually inserted
    const savedCase = await prisma.case.findUnique({
      where: { id: data.id },
    });
    expect(savedCase).not.toBeNull();
    expect(savedCase?.identifyingTerms).toBe(testIdentifyingTerms);
  });

  it('rejects empty identifying terms with a 400 error', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      body: JSON.stringify({ identifyingTerms: '' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('rejects whitespace-only identifying terms with a 400 error', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      body: JSON.stringify({ identifyingTerms: '   ' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
