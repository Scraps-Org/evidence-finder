import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from '../../src/app/api/cases/route';
import { prisma } from '../../src/lib/prisma';

vi.mock('../../src/lib/prisma', () => ({
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

  it('POST /api/cases creates a case and returns it', async () => {
    const body = { terms: 'Jane Smith' };
    (prisma.case.create as any).mockResolvedValue({ id: '123', ...body });

    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data).toEqual({ id: '123', terms: 'Jane Smith' });
    expect(prisma.case.create).toHaveBeenCalledWith({ data: body });
  });

  it('POST /api/cases returns 400 for empty terms', async () => {
    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ terms: '  ' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(prisma.case.create).not.toHaveBeenCalled();
  });

  it('GET /api/cases returns list of cases', async () => {
    const mockCases = [{ id: '1', terms: 'Case A' }, { id: '2', terms: 'Case B' }];
    (prisma.case.findMany as any).mockResolvedValue(mockCases);

    const req = new Request('http://localhost/api/cases', { method: 'GET' });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual(mockCases);
  });
});