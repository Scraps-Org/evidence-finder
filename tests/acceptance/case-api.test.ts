import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../../src/app/api/cases/route';

vi.mock('@prisma/client', () => {
  const mockPrismaClient = {
    case: {
      create: vi.fn<[{ data: { identifyingTerms: string } }], Promise<{ id: string; identifyingTerms: string; createdAt: Date }>>()
    }
  };
  return {
    PrismaClient: vi.fn<[], typeof mockPrismaClient>(() => mockPrismaClient)
  };
});

import { PrismaClient } from '@prisma/client';

describe('POST /api/cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inserts a new case into the database with valid identifying terms', async () => {
    const mockPrisma = new PrismaClient();
    const mockCreatedCase = {
      id: 'case-1',
      identifyingTerms: 'Test Case',
      createdAt: new Date()
    };

    vi.mocked(mockPrisma.case.create).mockResolvedValueOnce(mockCreatedCase);

    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: 'Test Case' })
    });

    const response = await POST(request);

    expect(response.status).toBe(201);
    const body = await response.json() as { id: string; identifyingTerms: string };
    expect(body.identifyingTerms).toBe('Test Case');
  });

  it('rejects empty identifying terms with 400 error', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '' })
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('rejects whitespace-only identifying terms with 400 error', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '   ' })
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});