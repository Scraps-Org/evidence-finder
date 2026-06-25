import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Prisma mock — isolates the route from a real DB while exercising upsert logic
// ---------------------------------------------------------------------------
const upsertMock = vi.fn();
const findManyMock = vi.fn();

vi.mock('../../src/lib/prisma', () => ({
  default: {
    candidate: {
      upsert: upsertMock,
      findMany: findManyMock,
    },
  },
}));

// ---------------------------------------------------------------------------
// BraveSource mock — isolates the route from live network; lets us control results
// ---------------------------------------------------------------------------
const searchMock = vi.fn();

vi.mock('../../src/lib/braveSource', () => ({
  BraveSource: vi.fn().mockImplementation(() => ({ search: searchMock })),
}));

async function importRoute() {
  const mod = await import('../../src/app/api/cases/[caseId]/search/route');
  return mod;
}

function makeRequest(caseId: string, body: Record<string, unknown>): Request {
  return new Request(`http://localhost/api/cases/${caseId}/search`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/cases/[caseId]/search route', () => {
  const CASE_ID = 'case-001';
  const TERMS = 'climate evidence 2024';
  const FAKE_RESULTS = [
    { url: 'https://example.com/a', title: 'Article A' },
    { url: 'https://example.com/b', title: 'Article B' },
  ];

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env['BRAVE_API_KEY'] = 'test-brave-token';

    searchMock.mockResolvedValue(FAKE_RESULTS);
    upsertMock.mockImplementation(({ create }: { create: { url: string; caseId: string; status: string } }) =>
      Promise.resolve({ id: `id-${create.url}`, url: create.url, caseId: create.caseId, status: create.status })
    );
    findManyMock.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('runs terms through BraveSource and calls upsert for each result', async () => {
    const { POST } = await importRoute();
    const res = await POST(
      makeRequest(CASE_ID, { terms: TERMS }),
      { params: Promise.resolve({ caseId: CASE_ID }) }
    );
    expect(res.status).toBe(200);
    expect(searchMock).toHaveBeenCalledWith(TERMS);
    expect(upsertMock).toHaveBeenCalledTimes(FAKE_RESULTS.length);
  });

  it('upserts each candidate with status "new" and the correct caseId', async () => {
    const { POST } = await importRoute();
    await POST(
      makeRequest(CASE_ID, { terms: TERMS }),
      { params: Promise.resolve({ caseId: CASE_ID }) }
    );

    for (const result of FAKE_RESULTS) {
      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ url_caseId: { url: result.url, caseId: CASE_ID } }),
          create: expect.objectContaining({ url: result.url, caseId: CASE_ID, status: 'new' }),
        })
      );
    }
  });

  it('does not create a duplicate when the same URL is upserted twice (idempotent dedup)', async () => {
    // Simulate: first call creates, second call returns existing (upsert semantics — called once per URL per invocation)
    const { POST } = await importRoute();

    await POST(
      makeRequest(CASE_ID, { terms: TERMS }),
      { params: Promise.resolve({ caseId: CASE_ID }) }
    );
    const firstCallCount = upsertMock.mock.calls.length;

    // Second invocation with the same terms/urls — upsert must be called again but must NOT insert duplicates
    // (Prisma upsert itself is idempotent; the route must pass the correct unique key)
    await POST(
      makeRequest(CASE_ID, { terms: TERMS }),
      { params: Promise.resolve({ caseId: CASE_ID }) }
    );
    const secondCallCount = upsertMock.mock.calls.length - firstCallCount;

    // Same number of upserts both times — Prisma deduplicates via unique constraint
    expect(secondCallCount).toBe(firstCallCount);

    // Verify the unique key passed is always (url, caseId)
    for (const call of upsertMock.mock.calls) {
      const arg = call[0] as { where: { url_caseId: { url: string; caseId: string } } };
      expect(arg.where.url_caseId).toMatchObject({ caseId: CASE_ID });
    }
  });

  it('returns ≥1 normalized candidate object each with a url field in the response body', async () => {
    const { POST } = await importRoute();
    const res = await POST(
      makeRequest(CASE_ID, { terms: TERMS }),
      { params: Promise.resolve({ caseId: CASE_ID }) }
    );

    expect(res.status).toBe(200);
    const body = await res.json() as { candidates: { url: string }[] };
    expect(Array.isArray(body.candidates)).toBe(true);
    expect(body.candidates.length).toBeGreaterThanOrEqual(1);
    for (const candidate of body.candidates) {
      expect(typeof candidate.url).toBe('string');
      expect(candidate.url.length).toBeGreaterThan(0);
    }
  });

  it('returns 400 when terms are missing from the request body', async () => {
    const { POST } = await importRoute();
    const res = await POST(
      makeRequest(CASE_ID, {}),
      { params: Promise.resolve({ caseId: CASE_ID }) }
    );
    expect(res.status).toBe(400);
  });
});
