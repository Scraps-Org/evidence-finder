import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from '../../src/app/api/cases/route';
import { prisma } from '../../src/lib/db';

vi.mock('../../src/lib/db', () => ({
  prisma: {
    case: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('Cases API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a case when valid terms are provided', async () => {
    const mockCase = { id: '1', terms: 'John Doe' };
    (prisma.case.create as any).mockResolvedValue(mockCase);

    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      body: JSON.stringify({ terms: 'John Doe' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data).toEqual(mockCase);
    expect(prisma.case.create).toHaveBeenCalledWith({
      data: { terms: 'John Doe' },
    });
  });

  it('should return 400 when terms are empty or whitespace', async () => {
    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      body: JSON.stringify({ terms: '   ' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(prisma.case.create).not.toHaveBeenCalled();
  });

  it('should return a list of cases', async () => {
    const mockCases = [{ id: '1', terms: 'Case A' }, { id: '2', terms: 'Case B' }];
    (prisma.case.findMany as any).mockResolvedValue(mockCases);

    const req = new Request('http://localhost/api/cases', { method: 'GET' });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual(mockCases);
  });
});