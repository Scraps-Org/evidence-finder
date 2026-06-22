import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../../src/app/api/cases/route';
import { prisma } from '../../src/lib/db';

vi.mock('../../src/lib/db', () => ({
  prisma: {
    case: {
      create: vi.fn(),
    },
  },
}));

describe('Case API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a case when valid terms are provided', async () => {
    const mockCase = { id: '1', terms: 'Jane Doe' };
    vi.mocked(prisma.case.create).mockResolvedValue(mockCase as never);

    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ terms: 'Jane Doe' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data).toEqual(mockCase);
    expect(prisma.case.create).toHaveBeenCalledWith({
      data: { terms: 'Jane Doe' },
    });
  });

  it('returns 400 when terms are empty or whitespace', async () => {
    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ terms: '  ' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(prisma.case.create).not.toHaveBeenCalled();
  });
});
