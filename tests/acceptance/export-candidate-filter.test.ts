import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../../src/app/api/cases/[caseId]/export/route';

vi.mock('../../src/lib/prisma', () => ({
  default: {
    candidate: {
      findMany: vi.fn(),
    },
  },
}));

describe('GET /api/cases/[caseId]/export — D5 export', () => {
  beforeEach(async () => {
    const { default: prisma } = await import('../../src/lib/prisma');
    vi.mocked(prisma.candidate.findMany).mockReset();
  });

  it('includes evidence candidates in the export', async () => {
    const { default: prisma } = await import('../../src/lib/prisma');
    const evidenceRecord = {
      id: 'cand-exp-1',
      url: 'https://example.com/export',
      title: 'Export Evidence',
      status: 'evidence',
      caseId: 'case-export-1',
      createdAt: new Date(),
    };
    vi.mocked(prisma.candidate.findMany).mockResolvedValue([evidenceRecord] as never);

    const req = new Request('http://test/api/cases/case-export-1/export', { method: 'GET' });
    const res = await GET(req, { params: Promise.resolve({ caseId: 'case-export-1' }) });

    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('Export Evidence');

    expect(vi.mocked(prisma.candidate.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          caseId: 'case-export-1',
          status: 'evidence',
        }) as unknown,
      }),
    );
  });

  it('excludes dismissed candidates from the export', async () => {
    const { default: prisma } = await import('../../src/lib/prisma');
    vi.mocked(prisma.candidate.findMany).mockResolvedValue([] as never);

    const req = new Request('http://test/api/cases/case-export-1/export', { method: 'GET' });
    const res = await GET(req, { params: Promise.resolve({ caseId: 'case-export-1' }) });

    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).not.toContain('Dismissed Item');

    expect(vi.mocked(prisma.candidate.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          caseId: 'case-export-1',
          status: 'evidence',
        }) as unknown,
      }),
    );
  });
});
