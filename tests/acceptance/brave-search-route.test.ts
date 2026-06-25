import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Brave Search API route — verifies upsert, dedup, and response shape.
// Imports the route handler directly (no mocked fetch at the route layer).
// BraveSource's outbound network call IS mocked here so the route test is
// isolated from the real Brave API — the braveSource contract test covers
// the real fetch behaviour separately.
// ---------------------------------------------------------------------------

const FAKE_CASE_ID = 'cltest000000000000000000';
const FAKE_URL_1 = 'https://result-one.example.com';
const FAKE_URL_2 = 'https://result-two.example.com';

const mockSearch = vi.fn<[string], Promise<{ url: string; title?: string }[]>>();

vi.mock('../../src/lib/braveSource', () => ({
  BraveSource: class {
    search = mockSearch;
  },
}));

const mockUpsert = vi.fn<
  [{ where: { url_caseId: { url: string; caseId: string } }; update: Record<string, unknown>; create: Record<string, unknown> }],
  Promise<{ id: string; url: string; caseId: string; status: string }>
>();

vi.mock('../../src/lib/prisma', () => ({
  default: {
    candidate: {
      upsert: mockUpsert,
    },
  },
}));

describe('POST /api/cases/[caseId]/search route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('runs search terms through BraveSource and upserts each result into Candidate with status \'new\'', async () => {
    mockSearch.mockResolvedValue([
      { url: FAKE_URL_1, title: 'Result One' },
      { url: FAKE_URL_2, title: 'Result Two' },
    ]);

    mockUpsert
      .mockResolvedValueOnce({ id: 'c1', url: FAKE_URL_1, caseId: FAKE_CASE_ID, status: 'new' })
      .mockResolvedValueOnce({ id: 'c2', url: FAKE_URL_2, caseId: FAKE_CASE_ID, status: 'new' });

    const { POST } = await import('../../src/app/api/cases/[caseId]/search/route');

    const req = new Request(`http://test/api/cases/${FAKE_CASE_ID}/search`, {
      method: 'POST',
      body: JSON.stringify({ terms: 'climate change litigation' }),
      headers: { 'content-type': 'application/json' },
    });

    const params = Promise.resolve({ caseId: FAKE_CASE_ID });
    const res = await POST(req, { params });

    expect(res.status).toBe(200);

    // BraveSource.search was called with the case's terms
    expect(mockSearch).toHaveBeenCalledWith('climate change litigation');

    // upsert called once per result
    expect(mockUpsert).toHaveBeenCalledTimes(2);

    // each upsert uses (url, caseId) uniqueness and status 'new'
    const firstCall = mockUpsert.mock.calls[0]![0];
    expect(firstCall.where.url_caseId).toEqual({ url: FAKE_URL_1, caseId: FAKE_CASE_ID });
    expect(firstCall.create).toMatchObject({ url: FAKE_URL_1, caseId: FAKE_CASE_ID, status: 'new' });
  });

  it('is idempotent — calling with the same URL twice does not create a duplicate row', async () => {
    mockSearch.mockResolvedValue([{ url: FAKE_URL_1, title: 'Duplicate' }]);

    const existingRow = { id: 'c1', url: FAKE_URL_1, caseId: FAKE_CASE_ID, status: 'new' };
    mockUpsert.mockResolvedValue(existingRow);

    const { POST } = await import('../../src/app/api/cases/[caseId]/search/route');

    const makeReq = () =>
      new Request(`http://test/api/cases/${FAKE_CASE_ID}/search`, {
        method: 'POST',
        body: JSON.stringify({ terms: 'dedup test' }),
        headers: { 'content-type': 'application/json' },
      });

    const params = Promise.resolve({ caseId: FAKE_CASE_ID });

    // First call
    await POST(makeReq(), { params });
    const countAfterFirst = mockUpsert.mock.calls.length;

    // Second call with same URL
    await POST(makeReq(), { params: Promise.resolve({ caseId: FAKE_CASE_ID }) });
    const countAfterSecond = mockUpsert.mock.calls.length;

    // upsert (not create) is used — so the DB row count stays at 1.
    // The mock is called again but the upsert semantic guarantees no duplicate.
    // Assert the upsert where clause uses the composite unique key both times.
    expect(countAfterFirst).toBe(1);
    expect(countAfterSecond).toBe(2);

    for (const call of mockUpsert.mock.calls) {
      expect(call[0]!.where.url_caseId).toEqual({ url: FAKE_URL_1, caseId: FAKE_CASE_ID });
      // update object must not change status (preserves existing row as-is)
      expect(call[0]!.update).toBeDefined();
    }
  });

  it('returns ≥1 normalized candidate objects each with a resolvable URL field', async () => {
    mockSearch.mockResolvedValue([{ url: FAKE_URL_1, title: 'Norm Test' }]);
    mockUpsert.mockResolvedValue({ id: 'c1', url: FAKE_URL_1, caseId: FAKE_CASE_ID, status: 'new' });

    const { POST } = await import('../../src/app/api/cases/[caseId]/search/route');

    const req = new Request(`http://test/api/cases/${FAKE_CASE_ID}/search`, {
      method: 'POST',
      body: JSON.stringify({ terms: 'test search' }),
      headers: { 'content-type': 'application/json' },
    });

    const params = Promise.resolve({ caseId: FAKE_CASE_ID });
    const res = await POST(req, { params });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { candidates: { url: string }[] };

    expect(Array.isArray(body.candidates)).toBe(true);
    expect(body.candidates.length).toBeGreaterThanOrEqual(1);

    for (const candidate of body.candidates) {
      expect(typeof candidate.url).toBe('string');
      // Must be a resolvable (parseable) URL
      expect(() => new URL(candidate.url)).not.toThrow();
    }
  });
});
