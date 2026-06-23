import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../../src/app/api/cases/route';

const mockCreate = vi.fn();
const mockCount = vi.fn();

vi.mock('../../src/lib/db', () => ({
  prisma: {
    case: {
      create: (...args: Parameters<typeof mockCreate>) => mockCreate(...args),
      count: (...args: Parameters<typeof mockCount>) => mockCount(...args),
    },
  },
}));

describe('POST /api/cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({ id: 1, identifyingTerms: 'Bob Jones' });
    mockCount.mockResolvedValue(0);
  });

  it('persists a new Case row when identifyingTerms is valid', async () => {
    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      body: JSON.stringify({ identifyingTerms: 'Bob Jones' }),
      headers: { 'content-type': 'application/json' },
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ identifyingTerms: 'Bob Jones' });
    expect(mockCreate).toHaveBeenCalledWith({
      data: { identifyingTerms: 'Bob Jones' },
    });
  });

  it('returns 4xx and does not write a row when identifyingTerms is empty string', async () => {
    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      body: JSON.stringify({ identifyingTerms: '' }),
      headers: { 'content-type': 'application/json' },
    });

    const res = await POST(req);

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('returns 4xx and does not write a row when identifyingTerms is whitespace-only', async () => {
    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      body: JSON.stringify({ identifyingTerms: '   ' }),
      headers: { 'content-type': 'application/json' },
    });

    const res = await POST(req);

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
