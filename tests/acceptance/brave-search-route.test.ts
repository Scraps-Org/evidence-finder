import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SearchSource, SearchResult } from '../../src/lib/searchSource'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeMockSource = (results: SearchResult[]): SearchSource => ({
  search: vi.fn<[string], Promise<SearchResult[]>>().mockResolvedValue(results),
})

// Minimal Prisma candidate mock — captures upsert calls for assertions.
const upsertedRows: Array<{ url: string; caseId: string; status: string }> = []
const findManyRows: Array<{ id: string; url: string; caseId: string; status: string }> = []

const prismaCandidate = {
  upsert: vi.fn(async (args: {
    where: { url_caseId: { url: string; caseId: string } }
    create: { url: string; caseId: string; status: string }
    update: Record<string, unknown>
  }) => {
    const key = `${args.create.url}::${args.create.caseId}`
    const existing = upsertedRows.find(
      (r) => r.url === args.create.url && r.caseId === args.create.caseId,
    )
    if (!existing) {
      const row = { ...args.create }
      upsertedRows.push(row)
      findManyRows.push({ id: `id-${upsertedRows.length}`, ...row })
    }
    return findManyRows.find(
      (r) => r.url === args.create.url && r.caseId === args.create.caseId,
    )
  }),
  findMany: vi.fn(async () => findManyRows),
}

vi.mock('../../src/lib/prisma', () => ({
  default: { candidate: prismaCandidate },
  prisma: { candidate: prismaCandidate },
}))

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/cases/[caseId]/search — brave search route', () => {
  const CASE_ID = 'case-abc-123'
  const TERMS = 'climate change litigation'

  beforeEach(() => {
    upsertedRows.length = 0
    findManyRows.length = 0
    vi.clearAllMocks()
  })

  it('runs case terms through BraveSource and upserts results with status "new"', async () => {
    const mockResults: SearchResult[] = [
      { url: 'https://example.com/a', title: 'Result A' },
      { url: 'https://example.com/b', title: 'Result B' },
    ]

    vi.doMock('../../src/lib/braveSource', () => ({
      BraveSource: vi.fn(() => makeMockSource(mockResults)),
    }))

    const { POST } = await import('../../src/app/api/cases/[caseId]/search/route')

    const req = new Request(`http://localhost/api/cases/${CASE_ID}/search`, {
      method: 'POST',
      body: JSON.stringify({ terms: TERMS }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req, { params: Promise.resolve({ caseId: CASE_ID }) })

    expect(res.status).toBe(200)
    expect(prismaCandidate.upsert).toHaveBeenCalledTimes(2)

    const firstCall = prismaCandidate.upsert.mock.calls[0]!
    expect(firstCall[0].create.status).toBe('new')
    expect(firstCall[0].create.caseId).toBe(CASE_ID)
    expect(firstCall[0].create.url).toBe('https://example.com/a')
  })

  it('deduplicates: calling upsert twice with the same URL does not create a duplicate row', async () => {
    const mockResults: SearchResult[] = [
      { url: 'https://example.com/dup', title: 'Dup' },
    ]

    vi.doMock('../../src/lib/braveSource', () => ({
      BraveSource: vi.fn(() => makeMockSource(mockResults)),
    }))

    const { POST } = await import('../../src/app/api/cases/[caseId]/search/route')

    const makeReq = () =>
      new Request(`http://localhost/api/cases/${CASE_ID}/search`, {
        method: 'POST',
        body: JSON.stringify({ terms: TERMS }),
        headers: { 'content-type': 'application/json' },
      })

    await POST(makeReq(), { params: Promise.resolve({ caseId: CASE_ID }) })
    await POST(makeReq(), { params: Promise.resolve({ caseId: CASE_ID }) })

    const rowsForUrl = upsertedRows.filter(
      (r) => r.url === 'https://example.com/dup' && r.caseId === CASE_ID,
    )
    expect(rowsForUrl).toHaveLength(1)
  })

  it('returns ≥1 normalized candidate object each with a resolvable url field', async () => {
    const mockResults: SearchResult[] = [
      { url: 'https://example.com/result', title: 'Result' },
    ]

    vi.doMock('../../src/lib/braveSource', () => ({
      BraveSource: vi.fn(() => makeMockSource(mockResults)),
    }))

    const { POST } = await import('../../src/app/api/cases/[caseId]/search/route')

    const req = new Request(`http://localhost/api/cases/${CASE_ID}/search`, {
      method: 'POST',
      body: JSON.stringify({ terms: TERMS }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req, { params: Promise.resolve({ caseId: CASE_ID }) })
    const body = await res.json() as { candidates: Array<{ url: string }> }

    expect(Array.isArray(body.candidates)).toBe(true)
    expect(body.candidates.length).toBeGreaterThanOrEqual(1)
    for (const candidate of body.candidates) {
      expect(typeof candidate.url).toBe('string')
      expect(candidate.url.length).toBeGreaterThan(0)
      // must be a valid absolute URL
      expect(() => new URL(candidate.url)).not.toThrow()
    }
  })
})
