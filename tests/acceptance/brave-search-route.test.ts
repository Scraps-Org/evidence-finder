import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Prisma client mock — intercepts upsert calls without a real DB.
// The dedup criterion is tested via idempotent upsert semantics.
const upsertMock = vi.fn<
  [
    {
      where: { url_caseId: { url: string; caseId: string } };
      update: Record<string, unknown>;
      create: Record<string, unknown>;
    },
  ],
  Promise<{ id: string; url: string; caseId: string; status: string }>
>();

vi.mock('../../src/lib/prisma', () => ({
  default: {
    candidate: {
      upsert: upsertMock,
    },
  },
}));

// BraveSource mock — isolates route from network.
const searchMock = vi.fn<[string], Promise<{ url: string; title?: string }[]>>();

vi.mock('../../src/lib/braveSource', () => ({
  BraveSource: vi.fn(() => ({ search: searchMock })),
}));

describe('POST /api/cases/[caseId]/search — brave search route', () => {
  const CASE_ID = 'case-abc-123';
  const TERMS = 'climate fraud liability';
  const CANDIDATE_URL = 'https://example.com/article';

  beforeEach(() => {
    searchMock.mockResolvedValue([{ url: CANDIDATE_URL, title: 'Example Article' }]);
    upsertMock.mockResolvedValue({
      id: 'cand-1',
      url: CANDIDATE_URL,
      caseId: CASE_ID,
      status: 'new',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls BraveSource.search with the case terms and upserts each result with status new', async () => {
    const { POST } = await import('../../src/app/api/cases/[caseId]/search/route');
    const req = new Request(`http://localhost/api/cases/${CASE_ID}/search`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ terms: TERMS }),
    });
    const res = await POST(req, { params: { caseId: CASE_ID } });
    expect(res.status).toBe(200);
    expect(searchMock).toHaveBeenCalledWith(TERMS);
    expect(upsertMock).toHaveBeenCalledOnce();
    const upsertCall = upsertMock.mock.calls[0]!;
    expect(upsertCall[0].create.status).toBe('new');
    expect(upsertCall[0].create.url).toBe(CANDIDATE_URL);
    expect(upsertCall[0].create.caseId).toBe(CASE_ID);
  });

  it('uses a uniqueness constraint of (url, caseId) so the same URL upserts once per case', async () => {
    const { POST } = await import('../../src/app/api/cases/[caseId]/search/route');
    const req = new Request(`http://localhost/api/cases/${CASE_ID}/search`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ terms: TERMS }),
    });
    await POST(req, { params: { caseId: CASE_ID } });
    const upsertCall = upsertMock.mock.calls[0]!;
    // where clause must key on both url and caseId
    const whereKey = upsertCall[0].where;
    expect(whereKey).toHaveProperty('url_caseId');
    expect(whereKey.url_caseId.url).toBe(CANDIDATE_URL);
    expect(whereKey.url_caseId.caseId).toBe(CASE_ID);
  });

  it('is idempotent — calling with the same URL twice does not create a duplicate (upsert called per URL, not insert)', async () => {
    const { POST } = await import('../../src/app/api/cases/[caseId]/search/route');
    const makeReq = () =>
      new Request(`http://localhost/api/cases/${CASE_ID}/search`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ terms: TERMS }),
      });
    await POST(makeReq(), { params: { caseId: CASE_ID } });
    await POST(makeReq(), { params: { caseId: CASE_ID } });
    // Each call resolves 1 URL → upsert called once per invocation (2 total)
    // but upsert semantics guarantee no duplicate row — not createMany.
    const calls = upsertMock.mock.calls;
    for (const call of calls) {
      expect(call[0]).toHaveProperty('where');
      expect(call[0]).toHaveProperty('update');
      expect(call[0]).toHaveProperty('create');
    }
    // All calls use upsert (not create), confirming dedup by contract
    expect(upsertMock).toHaveBeenCalledTimes(2);
  });

  it('returns ≥1 normalized candidate object each with a resolvable url field', async () => {
    const { POST } = await import('../../src/app/api/cases/[caseId]/search/route');
    const req = new Request(`http://localhost/api/cases/${CASE_ID}/search`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ terms: TERMS }),
    });
    const res = await POST(req, { params: { caseId: CASE_ID } });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { candidates: { url: string }[] };
    expect(Array.isArray(body.candidates)).toBe(true);
    expect(body.candidates.length).toBeGreaterThanOrEqual(1);
    for (const candidate of body.candidates) {
      expect(typeof candidate.url).toBe('string');
      expect(candidate.url.startsWith('http')).toBe(true);
    }
  });
});
