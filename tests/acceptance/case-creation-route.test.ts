import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../../src/app/api/cases/route';

vi.mock('../../src/lib/db', () => {
  const createMock = vi.fn();
  return {
    default: {
      case: {
        create: createMock,
        findMany: vi.fn().mockResolvedValue([]),
      },
    },
    prisma: {
      case: {
        create: createMock,
        findMany: vi.fn().mockResolvedValue([]),
      },
    },
  };
});

import { prisma } from '../../src/lib/db';

describe('POST /api/cases route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a Case row and returns 201 for valid identifyingTerms', async () => {
    vi.mocked(prisma.case.create).mockResolvedValue({
      id: 1,
      identifyingTerms: 'Alice Smith',
      createdAt: new Date(),
    });

    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      body: JSON.stringify({ identifyingTerms: 'Alice Smith' }),
      headers: { 'content-type': 'application/json' },
    });

    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = await res.json() as { identifyingTerms: string };
    expect(body.identifyingTerms).toBe('Alice Smith');
    expect(vi.mocked(prisma.case.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ identifyingTerms: 'Alice Smith' }),
      })
    );
  });

  it('returns 400 and writes no row when identifyingTerms is empty string', async () => {
    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      body: JSON.stringify({ identifyingTerms: '' }),
      headers: { 'content-type': 'application/json' },
    });

    const res = await POST(req);

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
    expect(vi.mocked(prisma.case.create)).not.toHaveBeenCalled();
  });

  it('returns 400 and writes no row when identifyingTerms is whitespace-only', async () => {
    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      body: JSON.stringify({ identifyingTerms: '   \t\n' }),
      headers: { 'content-type': 'application/json' },
    });

    const res = await POST(req);

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
    expect(vi.mocked(prisma.case.create)).not.toHaveBeenCalled();
  });
});
