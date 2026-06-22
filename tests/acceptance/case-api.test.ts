import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST } from '../../src/app/api/cases/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Case API Route - D2-case-input', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.case.deleteMany();
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  it('inserts a new case into the database on valid POST request', async () => {
    const identifyingTerms = `test-case-${Date.now()}`;
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms }),
    });

    const response = await POST(request);
    const responseData = await response.json() as { id: string; identifyingTerms: string };

    expect(response.status).toBe(200);
    expect(responseData.identifyingTerms).toBe(identifyingTerms);

    // Verify the case was actually inserted
    const savedCase = await prisma.case.findUnique({
      where: { id: responseData.id },
    });
    expect(savedCase).not.toBeNull();
    expect(savedCase!.identifyingTerms).toBe(identifyingTerms);
  });

  it('rejects empty identifying terms with error response', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const errorData = await response.json() as { error?: string };
    expect(errorData.error).toBeDefined();
  });

  it('rejects whitespace-only identifying terms with error response', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '   ' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('does not insert a row when input validation fails', async () => {
    const countBefore = await prisma.case.count();

    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '' }),
    });

    await POST(request);

    const countAfter = await prisma.case.count();
    expect(countAfter).toBe(countBefore);
  });
});
