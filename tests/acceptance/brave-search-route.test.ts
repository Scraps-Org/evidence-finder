import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { SearchSource, SearchResult } from '../../src/lib/searchSource'

// ---------------------------------------------------------------------------
// API route: POST /api/cases/[caseId]/search
// - runs terms through BraveSource
// - upserts each result into Candidate table (url unique per case, status 'new')
// - idempotent dedup
// - returns ≥1 normalized candidate with a url field
// ---------------------------------------------------------------------------

const CASE_ID = 'case-search-test-001'
const MOCK_RESULTS: SearchResult[] = [
  { url: 'https://result-a.example.com', title: 'Result A' },
  { url: 'https://result-b.example.com', title: 'Result B' },
]

// Prisma mock — tracks upsert calls to verify dedup
const upsertMock = vi.fn<
  [{ where: { url_caseId: { url: string; caseId: string } }; update: Record<string, unknown>; create: Record<string, unknown> }],
  Promise<{ id: string; url: string; caseId: string; status: string }>
>()

vi.mock('../../src/lib/prisma', () => ({
  default: {
    candidate: {
      upsert: upsertMock,
      findMany: vi.fn<[{ where: { caseId: string } }], Promise<{ id: string; url: string; caseId: string; status: string }[]>>(),
    },
  },
}))

// BraveSource mock — returns controlled results
const searchMock = vi.fn<[string], Promise<SearchResult[]>>()

vi.mock('../../src/lib/braveSource', () => ({
  BraveSource: vi.fn<[], SearchSource>(() => ({ search: searchMock })),
}))

describe('POST /api/cases/[caseId]/search route', () => {
  beforeEach(() => {
    vi.resetModules()
    searchMock.mockResolvedValue(MOCK_RESULTS)
    upsertMock.mockImplementation(
      async (args: { where: { url_caseId: { url: string; caseId: string } }; update: Record<string, unknown>; create: Record<string, unknown> }) => ({
        id: `id-${args.create['url'] as string}`,
        url: args.create['url'] as string,
        caseId: args.create['caseId'] as string,
        status: 'new',
      })
    )
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('runs case terms through BraveSource and upserts into Candidate with status new', async () => {
    const { POST } = await import('../../src/app/api/cases/[caseId]/search/route')

    const req = new Request(`http://localhost/api/cases/${CASE_ID}/search`, {
      method: 'POST',
      body: JSON.stringify({ terms: 'climate change litigation' }),
      headers: { 'content-type': 'application/json' },
    })

    const res = await POST(req, { params: { caseId: CASE_ID } })
    expect(res.status).toBe(200)

    expect(searchMock).toHaveBeenCalledWith('climate change litigation')

    expect(upsertMock).toHaveBeenCalledTimes(MOCK_RESULTS.length)

    const firstCall = upsertMock.mock.calls[0]![0]
    expect(firstCall.create['status']).toBe('new')
    expect(firstCall.create['caseId']).toBe(CASE_ID)
    expect(typeof firstCall.create['url']).toBe('string')
    // unique constraint key
    expect(firstCall.where.url_caseId).toMatchObject({
      url: firstCall.create['url'],
      caseId: CASE_ID,
    })
  })

  it('is idempotent: calling upsert a second time for the same URL does not create a duplicate (upsert semantics)', async () => {
    const { POST } = await import('../../src/app/api/cases/[caseId]/search/route')

    // Two sequential invocations with the same terms / same URLs
    const makeReq = () =>
      new Request(`http://localhost/api/cases/${CASE_ID}/search`, {
        method: 'POST',
        body: JSON.stringify({ terms: 'same terms' }),
        headers: { 'content-type': 'application/json' },
      })

    await POST(makeReq(), { params: { caseId: CASE_ID } })
    await POST(makeReq(), { params: { caseId: CASE_ID } })

    // Each invocation upserts each result URL; the upsert (not insert) call
    // count doubles but no raw INSERT can create a duplicate because the route
    // uses upsert with a (url, caseId) unique key.
    const allUpsertUrls = upsertMock.mock.calls.map(
      (c) => (c[0] as { where: { url_caseId: { url: string; caseId: string } } }).where.url_caseId.url
    )
    const firstRoundUrls = allUpsertUrls.slice(0, MOCK_RESULTS.length)
    const secondRoundUrls = allUpsertUrls.slice(MOCK_RESULTS.length)
    // Same URLs were upserted both rounds — idempotent by upsert contract
    expect(firstRoundUrls.sort()).toEqual(secondRoundUrls.sort())
  })

  it('returns ≥1 normalized candidate object each carrying a url field', async () => {
    const { POST } = await import('../../src/app/api/cases/[caseId]/search/route')

    const req = new Request(`http://localhost/api/cases/${CASE_ID}/search`, {
      method: 'POST',
      body: JSON.stringify({ terms: 'evidence discovery' }),
      headers: { 'content-type': 'application/json' },
    })

    const res = await POST(req, { params: { caseId: CASE_ID } })
    expect(res.status).toBe(200)

    const body = (await res.json()) as unknown
    const candidates = (body as { candidates: { url: string }[] }).candidates

    expect(Array.isArray(candidates)).toBe(true)
    expect(candidates.length).toBeGreaterThanOrEqual(1)
    for (const c of candidates) {
      expect(typeof c.url).toBe('string')
      expect(c.url.length).toBeGreaterThan(0)
    }
  })
})
