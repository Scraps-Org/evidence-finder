import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { SearchSource, SearchResult } from '../../src/lib/searchSource'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeResult(url: string): SearchResult {
  return { url, title: `Title for ${url}` }
}

function makeSearchSource(results: SearchResult[]): SearchSource {
  return {
    search: vi.fn<[string], Promise<SearchResult[]>>().mockResolvedValue(results),
  }
}

// ---------------------------------------------------------------------------
// We import the route handler directly (never via mocked fetch) so the real
// route logic — upsert, dedup, response shape — is exercised.
// The route for a specific case lives at:
//   src/app/api/cases/[caseId]/search/route.ts  (new file the coder will create)
// We mock prisma and the BraveSource constructor to stay DB-free here;
// the persistence layer is covered by the persistence spec below.
// ---------------------------------------------------------------------------

const MOCK_CASE_ID = 'case-abc-001'
const MOCK_TERMS = 'wrongful termination california'

const mockUpsert = vi.fn()
const mockFindUnique = vi.fn()

vi.mock('../../src/lib/prisma', () => ({
  default: {
    candidate: {
      upsert: mockUpsert,
      findUnique: mockFindUnique,
    },
    case: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('../../src/lib/braveSource', () => ({
  BraveSource: vi.fn(),
}))

describe('POST /api/cases/[caseId]/search — route handler', () => {
  beforeEach(async () => {
    vi.stubEnv('BRAVE_API_KEY', 'dummy-key')
    mockUpsert.mockReset()
    mockFindUnique.mockReset()

    // By default stub case lookup to succeed
    const prismaMod = await import('../../src/lib/prisma')
    const prisma = prismaMod.default
    ;(prisma.case.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: MOCK_CASE_ID,
      terms: MOCK_TERMS,
    })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it('runs case terms through BraveSource and upserts each result with status "new"', async () => {
    const results = [
      makeResult('https://example.com/a'),
      makeResult('https://example.com/b'),
    ]
    const { BraveSource } = await import('../../src/lib/braveSource')
    ;(BraveSource as ReturnType<typeof vi.fn>).mockImplementation(() =>
      makeSearchSource(results),
    )

    mockUpsert.mockImplementation(({ create }: { create: { url: string; status: string; caseId: string } }) =>
      Promise.resolve({ id: 'gen-id', ...create }),
    )

    const { POST } = await import('../../src/app/api/cases/[caseId]/search/route')
    const req = new Request(`http://localhost/api/cases/${MOCK_CASE_ID}/search`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ caseId: MOCK_CASE_ID }),
    })
    const res = await POST(req, { params: Promise.resolve({ caseId: MOCK_CASE_ID }) })

    expect(res.status).toBe(200)

    // Each result must be upserted with status 'new'
    expect(mockUpsert).toHaveBeenCalledTimes(results.length)
    for (const call of mockUpsert.mock.calls) {
      const arg = call[0] as { create: { status: string; caseId: string; url: string }; where: unknown }
      expect(arg.create.status).toBe('new')
      expect(arg.create.caseId).toBe(MOCK_CASE_ID)
      expect(typeof arg.create.url).toBe('string')
    }
  })

  it('upserts with a uniqueness constraint on (url, caseId) — same URL upserted not duplicated', async () => {
    const url = 'https://example.com/dupe'
    const results = [makeResult(url)]
    const { BraveSource } = await import('../../src/lib/braveSource')
    ;(BraveSource as ReturnType<typeof vi.fn>).mockImplementation(() =>
      makeSearchSource(results),
    )

    mockUpsert.mockResolvedValue({ id: 'row-1', url, caseId: MOCK_CASE_ID, status: 'new' })

    const { POST } = await import('../../src/app/api/cases/[caseId]/search/route')
    const makeReq = () =>
      new Request(`http://localhost/api/cases/${MOCK_CASE_ID}/search`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ caseId: MOCK_CASE_ID }),
      })

    // Call twice — upsert semantics mean no duplicate row
    await POST(makeReq(), { params: Promise.resolve({ caseId: MOCK_CASE_ID }) })
    await POST(makeReq(), { params: Promise.resolve({ caseId: MOCK_CASE_ID }) })

    // Every upsert call must use a `where` clause that encodes both url and caseId
    for (const call of mockUpsert.mock.calls) {
      const arg = call[0] as { where: Record<string, unknown> }
      const whereStr = JSON.stringify(arg.where)
      expect(whereStr).toContain(url)
      expect(whereStr).toContain(MOCK_CASE_ID)
    }
  })

  it('returns ≥1 normalized candidate object each carrying a url field', async () => {
    const results = [
      makeResult('https://result-one.example.com/page'),
      makeResult('https://result-two.example.com/page'),
    ]
    const { BraveSource } = await import('../../src/lib/braveSource')
    ;(BraveSource as ReturnType<typeof vi.fn>).mockImplementation(() =>
      makeSearchSource(results),
    )

    mockUpsert.mockImplementation(({ create }: { create: { url: string; status: string; caseId: string } }) =>
      Promise.resolve({ id: 'gen-id', ...create }),
    )

    const { POST } = await import('../../src/app/api/cases/[caseId]/search/route')
    const req = new Request(`http://localhost/api/cases/${MOCK_CASE_ID}/search`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ caseId: MOCK_CASE_ID }),
    })
    const res = await POST(req, { params: Promise.resolve({ caseId: MOCK_CASE_ID }) })
    const body = (await res.json()) as { candidates: { url: string }[] }

    expect(Array.isArray(body.candidates)).toBe(true)
    expect(body.candidates.length).toBeGreaterThanOrEqual(1)
    for (const candidate of body.candidates) {
      expect(typeof candidate.url).toBe('string')
      expect(candidate.url.length).toBeGreaterThan(0)
    }
  })
})
