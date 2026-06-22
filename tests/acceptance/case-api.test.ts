import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST } from '../../src/app/api/cases/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Case API Route', () => {
  afterEach(async () => {
    await prisma.$disconnect();
  });

  it('accepts valid identifying terms and inserts into Case table', async () => {
    const timestamp = Date.now().toString();
    const body = JSON.stringify({ identifyingTerms: `Test Case ${timestamp}` });
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    });

    const response = await POST(request);
    expect(response.status).toBe(201);

    const responseData = await response.json() as { id: string; identifyingTerms: string };
    expect(responseData).toHaveProperty('id');
    expect(responseData.identifyingTerms).toBe(`Test Case ${timestamp}`);

    const savedCase = await prisma.case.findUnique({
      where: { id: responseData.id },
    });
    expect(savedCase).not.toBeNull();
    expect(savedCase!.identifyingTerms).toBe(`Test Case ${timestamp}`);

    await prisma.case.delete({ where: { id: responseData.id } });
  });

  it('rejects empty identifying terms', async () => {
    const body = JSON.stringify({ identifyingTerms: '' });
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const responseData = await response.json() as { error: string };
    expect(responseData).toHaveProperty('error');
  });

  it('rejects whitespace-only identifying terms', async () => {
    const body = JSON.stringify({ identifyingTerms: '   ' });
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const responseData = await response.json() as { error: string };
    expect(responseData).toHaveProperty('error');
  });
});
