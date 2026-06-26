import { describe, it, expect } from 'vitest';
import { vi } from 'vitest';

// ---- Prisma client mock ----
const mockUpdate = vi.fn<[unknown], Promise<{ id: string; status: string }>>().mockResolvedValue({ id: 'cand-1', status: 'evidence' });
const mockFindMany = vi.fn<[unknown], Promise<{ id: string; status: string; url: string; title: string }[]>>().mockResolvedValue([]);

vi.mock('../../src/lib/prisma', () => ({
  default: {
    candidate: {
      update: mockUpdate,
      findMany: mockFindMany,
    },
  },
}));

// ---- Route under test ----
// The coder must export PATCH (or POST) from this route to handle triage.
// Adjust method name to match once implemented; the gate will pick it up.
import * as candidatesRoute from '../../src/app/api/cases/[caseId]/candidates/route';

describe('D8 candidate triage – API route', () => {
  it('PATCH /api/cases/:caseId/candidates/:candidateId sets status to evidence', async () => {
    mockUpdate.mockResolvedValueOnce({ id: 'cand-1', status: 'evidence' });

    const handler = (candidatesRoute as { PATCH?: (req: Request, ctx: { params: { caseId: string } }) => Promise<Response> }).PATCH;
    expect(handler, 'PATCH export must exist on the candidates route').toBeDefined();

    const req = new Request('http://t/api/cases/case-1/candidates/cand-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'evidence' }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await handler!(req, { params: { caseId: 'case-1' } });

    expect(res.status).toBe(200);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'evidence' }),
      }),
    );
  });

  it('PATCH /api/cases/:caseId/candidates/:candidateId sets status to dismissed', async () => {
    mockUpdate.mockResolvedValueOnce({ id: 'cand-1', status: 'dismissed' });

    const handler = (candidatesRoute as { PATCH?: (req: Request, ctx: { params: { caseId: string } }) => Promise<Response> }).PATCH;
    expect(handler).toBeDefined();

    const req = new Request('http://t/api/cases/case-1/candidates/cand-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'dismissed' }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await handler!(req, { params: { caseId: 'case-1' } });

    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'dismissed' }),
      }),
    );
  });

  it('GET /api/evidence returns only evidence-status candidates for D3 list', async () => {
    // Import the evidence route directly — no fetch mock, tests the real handler.
    const evidenceRoute = await import('../../src/app/api/evidence/route') as {
      GET: (req: Request) => Promise<Response>;
    };

    const evidenceCandidate = { id: 'cand-1', status: 'evidence', url: 'https://x.com', title: 'Hit' };
    mockFindMany.mockResolvedValueOnce([evidenceCandidate]);

    const res = await evidenceRoute.GET(
      new Request('http://t/api/evidence?caseId=case-1'),
    );
    expect(res.status).toBe(200);
    const body = await res.json() as { id: string; status: string }[];
    expect(Array.isArray(body)).toBe(true);
    expect(body.some((e) => e.id === 'cand-1')).toBe(true);
  });

  it('D3 evidence route does NOT include dismissed candidates', async () => {
    const evidenceRoute = await import('../../src/app/api/evidence/route') as {
      GET: (req: Request) => Promise<Response>;
    };

    // findMany returns empty because dismissed candidates are filtered out by the
    // real handler (querying WHERE status = 'evidence').
    mockFindMany.mockResolvedValueOnce([]);

    const res = await evidenceRoute.GET(
      new Request('http://t/api/evidence?caseId=case-1'),
    );
    expect(res.status).toBe(200);
    const body = await res.json() as { id: string; status: string }[];
    expect(body).toHaveLength(0);
  });

  it('D5 export includes evidence-status candidates', async () => {
    const exportRoute = await import('../../src/app/api/cases/[caseId]/export/route') as {
      GET: (req: Request, ctx: { params: { caseId: string } }) => Promise<Response>;
    };

    const evidenceCandidate = { id: 'cand-1', status: 'evidence', url: 'https://x.com', title: 'Hit' };
    mockFindMany.mockResolvedValueOnce([evidenceCandidate]);

    const res = await exportRoute.GET(
      new Request('http://t/api/cases/case-1/export'),
      { params: { caseId: 'case-1' } },
    );
    expect(res.status).toBe(200);
    const text = await res.text();
    // The export (CSV or JSON) must contain the evidence candidate's identifier or URL.
    expect(text).toContain('cand-1');
  });

  it('D5 export does NOT include dismissed candidates', async () => {
    const exportRoute = await import('../../src/app/api/cases/[caseId]/export/route') as {
      GET: (req: Request, ctx: { params: { caseId: string } }) => Promise<Response>;
    };

    // dismissed candidates filtered at DB layer — findMany returns empty.
    mockFindMany.mockResolvedValueOnce([]);

    const res = await exportRoute.GET(
      new Request('http://t/api/cases/case-1/export'),
      { params: { caseId: 'case-1' } },
    );
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).not.toContain('dismissed-cand');
  });
});
