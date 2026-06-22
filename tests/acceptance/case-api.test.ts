import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { POST } from '../../src/app/api/case/route';

const prisma = new PrismaClient();

describe('D2-case-input: Case API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await prisma.case.deleteMany();
  });

  it('inserts a case into Prisma when valid identifying terms are submitted', async () => {
    const request = new Request('http://localhost:3000/api/case', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ searchTerms: 'Jane Smith' }),
    });

    const response = await POST(request);
    const data = await response.json() as { id: string; searchTerms: string };

    expect(response.status).toBe(201);
    expect(data.searchTerms).toBe('Jane Smith');
    expect(data.id).toBeDefined();

    const savedCase = await prisma.case.findUnique({ where: { id: data.id } });
    expect(savedCase).not.toBeNull();
    expect(savedCase!.searchTerms).toBe('Jane Smith');
  });

  it('rejects empty string input with error response', async () => {
    const request = new Request('http://localhost:3000/api/case', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ searchTerms: '' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const count = await prisma.case.count();
    expect(count).toBe(0);
  });

  it('rejects whitespace-only input with error response', async () => {
    const request = new Request('http://localhost:3000/api/case', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ searchTerms: '   \n\t  ' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const count = await prisma.case.count();
    expect(count).toBe(0);
  });

  it('returns the inserted case data in response', async () => {
    const request = new Request('http://localhost:3000/api/case', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ searchTerms: 'Test Case 123' }),
    });

    const response = await POST(request);
    const data = await response.json() as { id: string; searchTerms: string };

    expect(response.status).toBe(201);
    expect(data).toEqual({
      id: expect.any(String),
      searchTerms: 'Test Case 123',
    });
  });
});