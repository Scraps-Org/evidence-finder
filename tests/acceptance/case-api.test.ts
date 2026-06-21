import { describe, it, expect, vi } from 'vitest';
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
  it('persists a case to the database when valid identifier is provided', async () => {
    const mockCase = { id: '123', identifier: 'Jane Doe' };
    (prisma.case.create as any).mockResolvedValue(mockCase);

    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'Jane Doe' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data).toEqual(mockCase);
    expect(prisma.case.create).toHaveBeenCalledWith({
      data: { identifier: 'Jane Doe' },
    });
  });

  it('returns 400 error when identifier is empty or whitespace', async () => {
    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '   ' }),
    });

    const res = await POST(req);
    
    expect(res.status).toBe(400);
    expect(prisma.case.create).not.toHaveBeenCalled();
  });
});