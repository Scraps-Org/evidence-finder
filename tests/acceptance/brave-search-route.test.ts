import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Minimal in-memory Prisma mock — only the Candidate model is needed.
// The mock is declared BEFORE importing the route so the vi.mock factory
// is hoisted and captures the stub correctly.
// ---------------------------------------------------------------------------
const candidateStore = new Map<string, { id: string; url: string; caseId: string; status: string }>();

const prismaMock = {
  candidate: {
    upsert: vi.fn(async (args: {
      where: { url_caseId: { url: string; caseId: string } };
      create: { url: string; caseId: string; status: string };
      update: Record<string, unknown>;
    }) => {
      const key = `${args.create.caseId}::${args.create.url}`;
      if (!candidateStore.has(key)) {
        const row = { id: `id-${candidateStore.size}`, ...args.create };
        candidateStore.set(key, row);
      }
      return candidateStore.get(key);
    }),
  },
};

vi.mock('../../src/lib/prisma', () => ({ prisma: prismaMock }));

// ---------------------------------------------------------------------------
// Mock BraveSource so the route test does NOT depend on the network or token.
// The route layer is what is under test; BraveSource is a dependency here.
// ---------------------------------------------------------------------------
const mockSearchResults = [
  { url: 'https://example.com/article-1' },
  { url: 'https://example.com/article-2' },
];

vi.mock('../../src/lib/braveSource', () => ({
  BraveSource: class {
    async search(_terms: string) {
      return mockSearchResults;
    }
  },
}));

describe('POST /api/cases/[caseId]/search — brave search route', () => {
  const CASE_ID = 'case-abc-001';

  beforeEach(() => {
    candidateStore.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function callRoute(caseId: string, terms: string) {
    const { POST } = await import('../../src/app/api/cases/[caseId]/search/route');
    const req = new Request(`http://localhost/api/cases/${caseId}/search`, {
      method: 'POST',
      body: JSON.stringify({ terms }),
      headers: { 'content-type': 'application/json' },
    });
    const params = Promise.resolve({ caseId });
    return POST(req, { params });
  }

  it('runs search terms through BraveSource and upserts each result into the Candidate table with status "new"', async () => {
    const res = await callRoute(CASE_ID, 'corporate fraud evidence');
    expect(res.status).toBe(200);

    // Upsert must have been called once per result returned by BraveSource
    expect(prismaMock.candidate.upsert).toHaveBeenCalledTimes(mockSearchResults.length);

    // Verify each upsert call uses status 'new' and the correct caseId
    for (const call of prismaMock.candidate.upsert.mock.calls) {
      const arg = call[0] as Parameters<typeof prismaMock.candidate.upsert>[0];
      expect(arg.create.status).toBe('new');
      expect(arg.create.caseId).toBe(CASE_ID);
    }
  });

  it('uses a (url, caseId) unique constraint so the same URL inserts at most once per case (idempotent dedup)', async () => {
    // First call
    await callRoute(CASE_ID, 'first run terms');
    const countAfterFirst = candidateStore.size;
    expect(countAfterFirst).toBe(mockSearchResults.length);

    // Second call with the SAME terms → same URLs → no new rows
    await callRoute(CASE_ID, 'first run terms');
    expect(candidateStore.size).toBe(countAfterFirst);

    // The upsert where clause must reference the composite unique key
    const firstCallArg = prismaMock.candidate.upsert.mock.calls[0]![0] as Parameters<typeof prismaMock.candidate.upsert>[0];
    expect(firstCallArg.where).toHaveProperty('url_caseId');
    expect(firstCallArg.where.url_caseId).toMatchObject({ url: expect.any(String) as string, caseId: CASE_ID });
  });

  it('returns ≥1 normalized candidate object each carrying a resolvable url field', async () => {
    const res = await callRoute(CASE_ID, 'search terms for url check');
    expect(res.status).toBe(200);

    const body = await res.json() as unknown;
    // Body must be an array (or an object with a candidates array)
    const candidates: unknown[] = Array.isArray(body)
      ? body
      : (body as { candidates?: unknown[] }).candidates ?? [];

    expect(candidates.length).toBeGreaterThanOrEqual(1);
    for (const c of candidates) {
      const candidate = c as { url?: unknown };
      expect(typeof candidate.url).toBe('string');
      expect((candidate.url as string).length).toBeGreaterThan(0);
      // url must look resolvable (starts with http:// or https://)
      expect(candidate.url as string).toMatch(/^https?:\/\//i);
    }
  });

  it('responds with 400 when terms are missing from the request body', async () => {
    const { POST } = await import('../../src/app/api/cases/[caseId]/search/route');
    const req = new Request(`http://localhost/api/cases/${CASE_ID}/search`, {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(req, { params: Promise.resolve({ caseId: CASE_ID }) });
    expect(res.status).toBe(400);
  });
});
