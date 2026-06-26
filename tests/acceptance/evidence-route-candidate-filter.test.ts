import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../../src/app/api/evidence/route';

vi.mock('../../src/lib/prisma', () => ({
  default: {
    candidate: {
      findMany: vi.fn(),
    },
  },
}));

describe('GET /api/evidence — D3 evidence list', () => {
  beforeEach(async () => {
    const { default: prisma } = await import('../../src/lib/prisma');
    vi.mocked(prisma.candidate.findMany).mockReset();
  });

  it('includes candidates with status=evidence', async () => {
    const { default: prisma } = await import('../../src/lib/prisma');
    const evidenceRecord = {
      id: 'cand-ev-1',
      url: 'https://example.com/ev',
      title: 'Evidence Item',
      status: 'evidence',
      caseId: 'case-1',
      createdAt: new Date(),
    };
    vi.mocked(prisma.candidate.findMany).mockResolvedValue([evidenceRecord] as never);

    const req = new Request('http://test/api/evidence', { method: 'GET' });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = (await res.json()) as unknown[];
    expect(Array.isArray(body)).toBe(true);
    const ids = body.map((r) => (r as { id: string }).id);
    expect(ids).toContain('cand-ev-1');

    expect(vi.mocked(prisma.candidate.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'evidence' }) as unknown,
      }),
    );
  });

  it('excludes candidates with status=dismissed', async () => {
    const { default: prisma } = await import('../../src/lib/prisma');
    vi.mocked(prisma.candidate.findMany).mockResolvedValue([] as never);

    const req = new Request('http://test/api/evidence', { method: 'GET' });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = (await res.json()) as unknown[];
    expect(body).toHaveLength(0);

    expect(vi.mocked(prisma.candidate.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'evidence' }) as unknown,
      }),
    );
  });
});
