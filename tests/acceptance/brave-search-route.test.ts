import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { SearchResult, SearchSource } from '../../src/lib/searchSource';

const CASE_ID = 'test-case-brave-001';
const TERMS = 'environmental damage liability';

const MOCK_RESULTS: SearchResult[] = [
  { url: 'https://example.com/result1', title: 'Result 1', snippet: 'Snippet 1' },
  { url: 'https://example.com/result2', title: 'Result 2', snippet: 'Snippet 2' },
];

const mockSearch = vi.fn<[string], Promise<SearchResult[]>>();

vi.mock('../../src/lib/braveSource', () => ({
  BraveSource: class implements SearchSource {
    search(query: string): Promise<SearchResult[]> {
      return mockSearch(query);
    }
  },
}));

const mockUpsert = vi.fn();
const mockFindMany = vi.fn();

vi.mock('../../src/lib/prisma', () => ({
  default: {
    candidate: {
      upsert: mockUpsert,
      findMany: mockFindMany,
    },
  },
}));

describe('POST /api/cases/[caseId]/search — brave search route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearch.mockResolvedValue(MOCK_RESULTS);
    MOCK_RESULTS.forEach((r) => {
      mockUpsert.mockResolvedValueOnce({
        id: Math.random().toString(),
        url: r.url,
        caseId: CASE_ID,
        status: 'new',
        title: r.title,
        snippet: r.snippet,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
    mockFindMany.mockResolvedValue(
      MOCK_RESULTS.map((r, i) => ({
        id: String(i),
        url: r.url,
        caseId: CASE_ID,
        status: 'new',
        title: r.title,
        snippet: r.snippet,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('runs case terms through BraveSource and upserts each result with status "new"', async () => {
    const { POST } = await import('../../src/app/api/cases/[caseId]/search/route');

    const req = new Request(`http://localhost/api/cases/${CASE_ID}/search`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ terms: TERMS }),
    });

    const res = await POST(req, { params: Promise.resolve({ caseId: CASE_ID }) });
    expect(res.status).toBe(200);

    expect(mockSearch).toHaveBeenCalledOnce();
    expect(mockSearch).toHaveBeenCalledWith(expect.stringContaining(TERMS.split(' ')[0]!));

    expect(mockUpsert).toHaveBeenCalledTimes(MOCK_RESULTS.length);
    for (const call of mockUpsert.mock.calls) {
      const arg = call[0] as {
        where: { url_caseId: { url: string; caseId: string } };
        create: { status: string; caseId: string; url: string };
        update: Record<string, unknown>;
      };
      expect(arg.create.status).toBe('new');
      expect(arg.create.caseId).toBe(CASE_ID);
      expect(arg.where.url_caseId.caseId).toBe(CASE_ID);
    }
  });

  it('deduplicates: calling the route twice with the same URL does not create duplicate rows', async () => {
    const singleResult: SearchResult[] = [
      { url: 'https://example.com/dup', title: 'Dup', snippet: 'dup snippet' },
    ];
    mockSearch.mockReset();
    mockSearch.mockResolvedValue(singleResult);

    const existingRow = {
      id: 'existing-id',
      url: 'https://example.com/dup',
      caseId: CASE_ID,
      status: 'new',
      title: 'Dup',
      snippet: 'dup snippet',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockUpsert.mockReset();
    mockUpsert.mockResolvedValue(existingRow);

    const { POST } = await import('../../src/app/api/cases/[caseId]/search/route');

    const makeReq = () =>
      new Request(`http://localhost/api/cases/${CASE_ID}/search`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ terms: TERMS }),
      });

    await POST(makeReq(), { params: Promise.resolve({ caseId: CASE_ID }) });
    await POST(makeReq(), { params: Promise.resolve({ caseId: CASE_ID }) });

    // Both calls used upsert (not insert), so the same url_caseId key was used each time
    const allWhereKeys = mockUpsert.mock.calls.map((c) => {
      const arg = c[0] as { where: { url_caseId: { url: string; caseId: string } } };
      return `${arg.where.url_caseId.url}::${arg.where.url_caseId.caseId}`;
    });
    const uniqueKeys = new Set(allWhereKeys);
    // Both invocations targeted the same unique key — confirms upsert (not insert)
    expect(allWhereKeys.length).toBe(2);
    expect(uniqueKeys.size).toBe(1);
  });

  it('returns ≥1 normalized candidate object each with a resolvable URL field', async () => {
    const { POST } = await import('../../src/app/api/cases/[caseId]/search/route');

    const req = new Request(`http://localhost/api/cases/${CASE_ID}/search`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ terms: TERMS }),
    });

    const res = await POST(req, { params: Promise.resolve({ caseId: CASE_ID }) });
    expect(res.status).toBe(200);

    const body = (await res.json()) as { candidates: Array<{ url: string }> };
    expect(Array.isArray(body.candidates)).toBe(true);
    expect(body.candidates.length).toBeGreaterThanOrEqual(1);

    for (const candidate of body.candidates) {
      expect(typeof candidate.url).toBe('string');
      expect(() => new URL(candidate.url)).not.toThrow();
    }
  });
});
