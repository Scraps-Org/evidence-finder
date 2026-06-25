import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { SearchResult } from '../../src/lib/searchSource';

// ---------------------------------------------------------------------------
// Criteria:
// - Route runs terms through BraveSource and upserts into Candidate table
// - status is 'new'; uniqueness is (url, caseId) — dedup on same URL
// - Response body contains ≥1 candidate each with a resolvable URL field
// ---------------------------------------------------------------------------

const CASE_ID = 'case-brave-test-001';
const MOCK_RESULTS: SearchResult[] = [
  { url: 'https://result.example.com/alpha', title: 'Alpha Result' },
  { url: 'https://result.example.com/beta', title: 'Beta Result' },
];

// We mock the BraveSource module so the route test never makes real HTTP calls,
// while the route itself (the layer under test) is exercised with real logic.
vi.mock('../../src/lib/braveSource', () => {
  const search = vi.fn<[string], Promise<SearchResult[]>>(async () => MOCK_RESULTS);
  return {
    BraveSource: vi.fn().mockImplementation(() => ({ search })),
  };
});

// We also mock Prisma so the route test does not need a live database.
// The mock tracks upsert calls so we can assert dedup behaviour.
const upsertedRows: Array<{ url: string; caseId: string; status: string }> = [];
const seenKeys = new Set<string>();

vi.mock('../../src/lib/prisma', () => {
  const upsert = vi.fn(
    async (args: {
      where: { url_caseId: { url: string; caseId: string } };
      update: Record<string, unknown>;
      create: { url: string; caseId: string; status: string };
    }) => {
      const key = `${args.create.caseId}::${args.create.url}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        upsertedRows.push(args.create);
      }
      return { ...args.create, id: upsertedRows.length };
    },
  );
  return {
    default: {
      candidate: { upsert },
    },
  };
});

describe('brave-search API route', () => {
  beforeEach(() => {
    upsertedRows.length = 0;
    seenKeys.clear();
    process.env.BRAVE_API_KEY = 'test-token';
  });

  afterEach(() => {
    delete process.env.BRAVE_API_KEY;
  });

  it('upserts each result into Candidate with status "new" and (url, caseId) uniqueness', async () => {
    const { POST } = await import('../../src/app/api/cases/[caseId]/search/route');
    const req = new Request(`http://t/api/cases/${CASE_ID}/search`, {
      method: 'POST',
      body: JSON.stringify({ terms: 'climate change mitigation' }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(req, { params: { caseId: CASE_ID } });
    expect(res.status).toBe(200);
    // Every upserted row must have status 'new' and the correct caseId.
    expect(upsertedRows.length).toBeGreaterThanOrEqual(1);
    for (const row of upsertedRows) {
      expect(row.status).toBe('new');
      expect(row.caseId).toBe(CASE_ID);
      expect(row.url).toMatch(/^https?:\/\//u);
    }
  });

  it('is idempotent: calling with the same URL twice does not create a duplicate row', async () => {
    const { POST } = await import('../../src/app/api/cases/[caseId]/search/route');
    const makeReq = () =>
      new Request(`http://t/api/cases/${CASE_ID}/search`, {
        method: 'POST',
        body: JSON.stringify({ terms: 'dedup test terms' }),
        headers: { 'content-type': 'application/json' },
      });

    await POST(makeReq(), { params: { caseId: CASE_ID } });
    const countAfterFirst = upsertedRows.length;
    expect(countAfterFirst).toBeGreaterThanOrEqual(1);

    await POST(makeReq(), { params: { caseId: CASE_ID } });
    const countAfterSecond = upsertedRows.length;

    // The second call must not have grown the stored-row count.
    expect(countAfterSecond).toBe(countAfterFirst);
  });

  it('returns ≥1 candidate object each containing a resolvable URL field', async () => {
    const { POST } = await import('../../src/app/api/cases/[caseId]/search/route');
    const req = new Request(`http://t/api/cases/${CASE_ID}/search`, {
      method: 'POST',
      body: JSON.stringify({ terms: 'renewable energy sources' }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(req, { params: { caseId: CASE_ID } });
    expect(res.status).toBe(200);
    const body = (await res.json()) as unknown;
    // Expect either { candidates: [...] } or a top-level array.
    const candidates: unknown[] = Array.isArray(body)
      ? body
      : (body as Record<string, unknown[]>).candidates ?? [];
    expect(candidates.length).toBeGreaterThanOrEqual(1);
    for (const c of candidates) {
      const candidate = c as Record<string, unknown>;
      const url = candidate['url'] ?? candidate['href'] ?? candidate['link'];
      expect(typeof url).toBe('string');
      expect(String(url)).toMatch(/^https?:\/\//u);
    }
  });
});
