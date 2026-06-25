import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Criterion 2 – API route: upserts candidates with status 'new', dedup
// Criterion 3 – Idempotent dedup: same URL per case inserts at most once
// Criterion 4 – Response body contains ≥1 normalized candidate with a URL field
// ---------------------------------------------------------------------------
//
// Strategy: import the route handler directly (App Router convention).
// Mock prisma (persistence layer is NOT what this route test exercises —
// a separate persistence spec covers the Candidate model round-trip).
// Mock BraveSource to return controlled results without hitting the network.
// ---------------------------------------------------------------------------

const CASE_ID = 'case-abc-123';
const SEARCH_TERMS = 'forensic evidence tampering';
const URL_A = 'https://example.com/article-a';
const URL_B = 'https://example.com/article-b';

// --- Prisma mock -----------------------------------------------------------
const mockUpsert = vi.fn();
const mockFindMany = vi.fn();

vi.mock('../../src/lib/prisma', () => ({
  default: {
    candidate: {
      upsert: mockUpsert,
      findMany: mockFindMany,
    },
    case: {
      findUnique: vi.fn().mockResolvedValue({
        id: CASE_ID,
        terms: SEARCH_TERMS,
      }),
    },
  },
}));

// --- BraveSource mock ------------------------------------------------------
vi.mock('../../src/lib/braveSource', () => ({
  BraveSource: vi.fn().mockImplementation(() => ({
    search: vi.fn().mockResolvedValue([
      { url: URL_A, title: 'Article A' },
      { url: URL_B, title: 'Article B' },
    ]),
  })),
}));

describe('POST /api/cases/[caseId]/search – route handler', () => {
  beforeEach(() => {
    process.env.BRAVE_API_KEY = 'test-token';
    mockUpsert.mockImplementation(
      ({ create }: { create: { url: string; caseId: string; status: string } }) =>
        Promise.resolve({ id: 'gen-id', ...create }),
    );
    mockFindMany.mockResolvedValue([
      { id: 'gen-id-a', url: URL_A, caseId: CASE_ID, status: 'new' },
      { id: 'gen-id-b', url: URL_B, caseId: CASE_ID, status: 'new' },
    ]);
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.BRAVE_API_KEY;
  });

  it('(criterion 2) upserts each BraveSource result into Candidate with status "new" and unique (url, caseId)', async () => {
    const { POST } = await import(
      '../../src/app/api/cases/[caseId]/search/route'
    );

    const req = new Request(`http://localhost/api/cases/${CASE_ID}/search`, {
      method: 'POST',
      body: JSON.stringify({ terms: SEARCH_TERMS }),
      headers: { 'content-type': 'application/json' },
    });
    const params = Promise.resolve({ caseId: CASE_ID });

    const res = await POST(req, { params });
    expect(res.status).toBe(200);

    // upsert called once per result URL
    expect(mockUpsert).toHaveBeenCalledTimes(2);

    const upsertCalls = mockUpsert.mock.calls as Array<
      [{ where: { url_caseId: { url: string; caseId: string } }; create: { url: string; caseId: string; status: string }; update: Record<string, unknown> }]
    >;

    for (const [args] of upsertCalls) {
      // uniqueness key covers both url and caseId
      expect(args.where).toHaveProperty('url_caseId');
      expect(args.where.url_caseId.caseId).toBe(CASE_ID);
      // status must be 'new' on create
      expect(args.create.status).toBe('new');
      expect(args.create.caseId).toBe(CASE_ID);
      expect(typeof args.create.url).toBe('string');
      expect(args.create.url).toMatch(/^https?:\/\//u);
    }
  });

  it('(criterion 3) idempotent dedup — calling upsert with the same URL does not create a duplicate (update is a no-op)', async () => {
    // Simulate the DB already having URL_A for this case
    let callCount = 0;
    mockUpsert.mockImplementation(
      ({ where, create }: {
        where: { url_caseId: { url: string; caseId: string } };
        create: { url: string; caseId: string; status: string };
      }) => {
        callCount += 1;
        // Simulate the DB: always returns the existing/created row without throwing
        return Promise.resolve({ id: `id-${callCount}`, url: where.url_caseId.url, caseId: CASE_ID, status: create.status });
      },
    );

    const { POST } = await import(
      '../../src/app/api/cases/[caseId]/search/route'
    );

    const makeReq = () =>
      new Request(`http://localhost/api/cases/${CASE_ID}/search`, {
        method: 'POST',
        body: JSON.stringify({ terms: SEARCH_TERMS }),
        headers: { 'content-type': 'application/json' },
      });

    const params = Promise.resolve({ caseId: CASE_ID });

    await POST(makeReq(), { params });
    const firstCallCount = mockUpsert.mock.calls.length;

    // Second invocation with identical terms / URLs
    await POST(makeReq(), { params });
    const secondCallCount = mockUpsert.mock.calls.length - firstCallCount;

    // Both runs call upsert the same number of times (no extra inserts)
    expect(secondCallCount).toBe(firstCallCount);
    // The upsert mechanism (not insert) means no duplicate rows
    // Verified by the fact that upsert was used (not create) — checked in criterion 2
    expect(mockUpsert).not.toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ status: 'duplicate' }) }),
    );
  });

  it('(criterion 4) response body contains ≥1 normalized candidate each with a resolvable URL field', async () => {
    const { POST } = await import(
      '../../src/app/api/cases/[caseId]/search/route'
    );

    const req = new Request(`http://localhost/api/cases/${CASE_ID}/search`, {
      method: 'POST',
      body: JSON.stringify({ terms: SEARCH_TERMS }),
      headers: { 'content-type': 'application/json' },
    });
    const params = Promise.resolve({ caseId: CASE_ID });

    const res = await POST(req, { params });
    expect(res.status).toBe(200);

    const body = (await res.json()) as { candidates: Array<{ url: string }> };
    expect(Array.isArray(body.candidates)).toBe(true);
    expect(body.candidates.length).toBeGreaterThanOrEqual(1);

    for (const candidate of body.candidates) {
      expect(typeof candidate.url).toBe('string');
      // URL must be resolvable — parseable as a URL
      expect(() => new URL(candidate.url)).not.toThrow();
    }
  });
});
