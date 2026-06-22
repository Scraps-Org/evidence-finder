import { describe, it, expect, afterEach } from 'vitest';
import { POST } from '../../src/app/api/cases/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('D2-case-input: Case API route', () => {
  afterEach(async () => {
    await prisma.case.deleteMany({});
  });

  it('inserts a case into the database when given valid identifying terms', async () => {
    const timestamp = Date.now().toString();
    const requestBody = JSON.stringify({
      identifyingTerms: `Test Case ${timestamp}`,
    });

    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody,
    });

    const response = await POST(request);
    expect(response.status).toBe(201);

    const responseData = await response.json() as { id: string; identifyingTerms: string };
    expect(responseData.identifyingTerms).toBe(`Test Case ${timestamp}`);

    const savedCase = await prisma.case.findUnique({
      where: { id: responseData.id },
    });
    expect(savedCase).not.toBeNull();
    expect(savedCase?.identifyingTerms).toBe(`Test Case ${timestamp}`);
  });

  it('rejects empty identifying terms with a 400 error', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const casesCount = await prisma.case.count();
    expect(casesCount).toBe(0);
  });

  it('rejects whitespace-only identifying terms with a 400 error', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '   ' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const casesCount = await prisma.case.count();
    expect(casesCount).toBe(0);
  });

  it('returns 400 for missing identifyingTerms field', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
