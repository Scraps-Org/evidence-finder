import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { SearchSource } from '../../src/lib/searchSource'

// ---------------------------------------------------------------------------
// API route: POST /api/cases/[caseId]/search
// We import the route handler DIRECTLY (not through fetch) to test the
// server layer.  BraveSource (the external HTTP layer) is mocked so we stay
// focused on: routing, Prisma upsert logic, dedup, and response shape.
// Prisma is stubbed via vi.mock so no real DB is required at this layer
// (a separate persistence spec covers the real round-trip).
// ---------------------------------------------------------------------------

const CASE_ID = 'case-abc-123'
const FAKE_RESULTS = [
  { url: 'https://example.com/result1', title: 'Result 1' },
  { url: 'https://example.com/result2', title: 'Result 2' },
]

// Prisma mock — must be hoisted before any import that pulls prisma
vi.mock('../../src/lib/prisma', () => {
  const upsertMock = vi.fn().mockImplementation(
    async ({ create }: { create: { url: string; caseId: string; status: string } }) =>
      create,
  )
  return {
    default: {
      candidate: {
        upsert: upsertMock,
      },
      case: {
        findUnique: vi.fn().mockResolvedValue({
          id: CASE_ID,
          terms: 'personal injury negligence',
        }),
      },
    },
  }
})

// BraveSource mock — isolates the route from the real HTTP layer
vi.mock('../../src/lib/braveSource', () => {
  const MockBraveSource = vi.fn().mockImplementation(
    (): SearchSource => ({
      search: vi.fn().mockResolvedValue(FAKE_RESULTS),
    }),
  )
  return { BraveSource: MockBraveSource }
})

describe('POST /api/cases/[caseId]/search – route handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const makeRequest = (caseId = CASE_ID) =>
    new Request(`http://localhost/api/cases/${caseId}/search`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })

  it('runs case terms through BraveSource and returns ≥1 normalized candidate with a url field', async () => {
    const { POST } = await import(
      '../../src/app/api/cases/[caseId]/search/route'
    )
    const res = await POST(makeRequest(), { params: Promise.resolve({ caseId: CASE_ID }) })

    expect(res.status).toBe(200)
    const body = (await res.json()) as { candidates: Array<{ url: string }> }
    expect(Array.isArray(body.candidates)).toBe(true)
    expect(body.candidates.length).toBeGreaterThanOrEqual(1)
    for (const candidate of body.candidates) {
      expect(typeof candidate.url).toBe('string')
      expect(candidate.url.startsWith('http')).toBe(true)
    }
  })

  it('upserts each result into Prisma Candidate table with status "new"', async () => {
    const prismaModule = await import('../../src/lib/prisma')
    const prisma = prismaModule.default
    const { POST } = await import(
      '../../src/app/api/cases/[caseId]/search/route'
    )

    await POST(makeRequest(), { params: Promise.resolve({ caseId: CASE_ID }) })

    const upsertMock = vi.mocked(prisma.candidate.upsert)
    expect(upsertMock).toHaveBeenCalledTimes(FAKE_RESULTS.length)

    for (const call of upsertMock.mock.calls) {
      const arg = call[0]
      expect(arg.create.status).toBe('new')
      expect(typeof arg.create.url).toBe('string')
      expect(arg.create.caseId).toBe(CASE_ID)
    }
  })

  it('uses a uniqueness constraint of (url, caseId) in the upsert where clause', async () => {
    const prismaModule = await import('../../src/lib/prisma')
    const prisma = prismaModule.default
    const { POST } = await import(
      '../../src/app/api/cases/[caseId]/search/route'
    )

    await POST(makeRequest(), { params: Promise.resolve({ caseId: CASE_ID }) })

    const upsertMock = vi.mocked(prisma.candidate.upsert)
    for (const call of upsertMock.mock.calls) {
      const arg = call[0]
      // The where clause must encode both url and caseId for per-case dedup
      const whereKeys = Object.keys(arg.where)
      const whereStr = JSON.stringify(arg.where)
      const hasUrlAndCase =
        (whereKeys.includes('url_caseId') ||
          (whereStr.includes('url') && whereStr.includes('caseId'))) &&
        whereStr.includes(CASE_ID)
      expect(hasUrlAndCase).toBe(true)
    }
  })

  it('is idempotent: calling the route twice with the same URL does not create a duplicate', async () => {
    const prismaModule = await import('../../src/lib/prisma')
    const prisma = prismaModule.default
    const { POST } = await import(
      '../../src/app/api/cases/[caseId]/search/route'
    )

    await POST(makeRequest(), { params: Promise.resolve({ caseId: CASE_ID }) })
    const firstCallCount = vi.mocked(prisma.candidate.upsert).mock.calls.length

    // Second call simulates the same URL arriving again; upsert must handle it
    // without error (Prisma upsert semantics — no new row inserted for same key)
    await POST(makeRequest(), { params: Promise.resolve({ caseId: CASE_ID }) })
    const secondCallCount = vi.mocked(prisma.candidate.upsert).mock.calls.length

    // Each invocation upserts the same count (upsert is called same times)
    // The DB-level dedup is the unique constraint — the route must use upsert
    // (not create) so duplicate-URL calls don't throw
    expect(secondCallCount).toBe(firstCallCount * 2)
  })
})
