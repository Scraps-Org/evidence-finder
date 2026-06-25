import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Route handler layer test — imports the Next.js App Router POST handler directly.
// Mocks: fetch (Brave API) and prisma (persistence) — these are NOT the layer under test.
// The layer under test is the route handler logic: orchestration, upsert, dedup, response shape.

vi.mock('../../src/lib/prisma', () => ({
  default: {
    candidate: {
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('POST /api/cases/[caseId]/search — brave search route', () => {
  const CASE_ID = 'case-test-001';
  const SEARCH_TERMS = 'climate litigation 2024';
  const CANDIDATE_URL = 'https://example-result.com/article';

  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('BRAVE_API_KEY', 'test-brave-key');

    const mockFetch = vi.fn<[RequestInfo | URL, RequestInit | undefined], Promise<Response>>().mockResolvedValue(
      new Response(
        JSON.stringify({
          web: {
            results: [
              { url: CANDIDATE_URL, title: 'Test Result' },
            ],
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('upserts each result into Candidate with status "new" and unique (url, caseId)', async () => {
    const prisma = (await import('../../src/lib/prisma')).default;
    const upsertMock = vi.mocked(prisma.candidate.upsert);
    upsertMock.mockResolvedValue({
      id: '1',
      url: CANDIDATE_URL,
      caseId: CASE_ID,
      status: 'new',
      createdAt: new Date(),
    } as Parameters<typeof upsertMock.mock.results[0]['value']>[0] extends Promise<infer R> ? R : never);

    const { POST } = await import('../../src/app/api/cases/[caseId]/search/route');

    const req = new Request(`http://localhost/api/cases/${CASE_ID}/search`, {
      method: 'POST',
      body: JSON.stringify({ terms: SEARCH_TERMS }),
      headers: { 'content-type': 'application/json' },
    });

    const res = await POST(req, { params: { caseId: CASE_ID } });
    expect(res.status).toBe(200);

    // Must have called upsert (not create) for dedup
    expect(upsertMock).toHaveBeenCalled();

    const upsertCall = upsertMock.mock.calls[0]![0];
    // status must be 'new'
    expect(upsertCall.create).toMatchObject({ status: 'new', url: CANDIDATE_URL, caseId: CASE_ID });
    // where clause must reference both url and caseId for uniqueness
    const whereStr = JSON.stringify(upsertCall.where);
    expect(whereStr).toContain(CANDIDATE_URL);
    expect(whereStr).toContain(CASE_ID);
  });

  it('is idempotent — calling twice with the same URL does not duplicate (upsert, not insert)', async () => {
    const prisma = (await import('../../src/lib/prisma')).default;
    const upsertMock = vi.mocked(prisma.candidate.upsert);
    const existingRow = {
      id: '1',
      url: CANDIDATE_URL,
      caseId: CASE_ID,
      status: 'new',
      createdAt: new Date(),
    };
    upsertMock.mockResolvedValue(existingRow as Parameters<typeof upsertMock>[0] extends { create: infer C } ? C & { id: string; createdAt: Date } : never);

    const { POST } = await import('../../src/app/api/cases/[caseId]/search/route');

    const makeReq = () =>
      new Request(`http://localhost/api/cases/${CASE_ID}/search`, {
        method: 'POST',
        body: JSON.stringify({ terms: SEARCH_TERMS }),
        headers: { 'content-type': 'application/json' },
      });

    await POST(makeReq(), { params: { caseId: CASE_ID } });
    await POST(makeReq(), { params: { caseId: CASE_ID } });

    // upsert is called (not create), so dedup is handled by the DB constraint;
    // the route must NOT call create and must use upsert (idempotent by design)
    expect(upsertMock).toHaveBeenCalledTimes(2);
    // Both calls target the same URL — the DB upsert handles dedup, row count unchanged
    const firstWhere = JSON.stringify(upsertMock.mock.calls[0]![0].where);
    const secondWhere = JSON.stringify(upsertMock.mock.calls[1]![0].where);
    expect(firstWhere).toEqual(secondWhere);
  });

  it('response body contains ≥1 candidate object each with a resolvable url field', async () => {
    const prisma = (await import('../../src/lib/prisma')).default;
    const upsertMock = vi.mocked(prisma.candidate.upsert);
    upsertMock.mockResolvedValue({
      id: '1',
      url: CANDIDATE_URL,
      caseId: CASE_ID,
      status: 'new',
      createdAt: new Date(),
    } as Parameters<typeof upsertMock>[0] extends { create: infer C } ? C & { id: string; createdAt: Date } : never);

    const { POST } = await import('../../src/app/api/cases/[caseId]/search/route');

    const req = new Request(`http://localhost/api/cases/${CASE_ID}/search`, {
      method: 'POST',
      body: JSON.stringify({ terms: SEARCH_TERMS }),
      headers: { 'content-type': 'application/json' },
    });

    const res = await POST(req, { params: { caseId: CASE_ID } });
    expect(res.status).toBe(200);

    const body = await res.json() as unknown;
    // Response must be an array or have a candidates array
    const candidates = Array.isArray(body)
      ? (body as Record<string, unknown>[])
      : ((body as Record<string, unknown[]>).candidates as Record<string, unknown>[]);

    expect(Array.isArray(candidates)).toBe(true);
    expect(candidates.length).toBeGreaterThanOrEqual(1);

    for (const candidate of candidates) {
      expect(typeof candidate.url).toBe('string');
      // URL must be non-empty and resolvable (parseable as a URL)
      expect(() => new URL(candidate.url as string)).not.toThrow();
    }
  });
});
