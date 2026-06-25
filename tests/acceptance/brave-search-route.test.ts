import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { POST } from '../../src/app/api/cases/[caseId]/search/route'

// Mock BraveSource so we control results without a live network call,
// while the route handler itself (the layer under test) is NOT mocked.
vi.mock('../../src/lib/braveSource', () => ({
  BraveSource: class {
    async search(_query: string): Promise<Array<{ url: string; title: string }>> {
      return [
        { url: 'https://result-one.example.com', title: 'Result One' },
        { url: 'https://result-two.example.com', title: 'Result Two' },
      ]
    }
  },
}))

// Mock prisma to avoid a real DB — the persistence layer is covered separately.
vi.mock('../../src/lib/prisma', () => {
  const upsertMock = vi.fn<
    [{ where: { url_caseId: { url: string; caseId: string } }; update: Record<string, unknown>; create: Record<string, unknown> }],
    Promise<{ id: string; url: string; caseId: string; status: string }>
  >()

  return {
    default: {
      candidate: {
        upsert: upsertMock,
        findMany: vi.fn<[{ where: { caseId: string } }], Promise<Array<{ id: string; url: string; caseId: string; status: string }>>>()
          .mockResolvedValue([
            { id: 'c1', url: 'https://result-one.example.com', caseId: 'case-123', status: 'new' },
            { id: 'c2', url: 'https://result-two.example.com', caseId: 'case-123', status: 'new' },
          ]),
      },
      case: {
        findUniqueOrThrow: vi.fn<[{ where: { id: string } }], Promise<{ id: string; terms: string }>>()
          .mockResolvedValue({ id: 'case-123', terms: 'wrongful termination California' }),
      },
    },
  }
})

import prisma from '../../src/lib/prisma'

describe('POST /api/cases/[caseId]/search route', () => {
  const CASE_ID = 'case-123'

  beforeEach(() => {
    vi.clearAllMocks()
    // Re-apply findMany and findUniqueOrThrow defaults after clearAllMocks
    vi.mocked(prisma.case.findUniqueOrThrow).mockResolvedValue({ id: CASE_ID, terms: 'wrongful termination California' })
    vi.mocked(prisma.candidate.findMany).mockResolvedValue([
      { id: 'c1', url: 'https://result-one.example.com', caseId: CASE_ID, status: 'new' },
      { id: 'c2', url: 'https://result-two.example.com', caseId: CASE_ID, status: 'new' },
    ])
    vi.mocked(prisma.candidate.upsert).mockResolvedValue(
      { id: 'c1', url: 'https://result-one.example.com', caseId: CASE_ID, status: 'new' }
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('upserts each result with status "new" and (url, caseId) uniqueness constraint', async () => {
    const req = new Request(`http://localhost/api/cases/${CASE_ID}/search`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })

    const res = await POST(req, { params: { caseId: CASE_ID } })
    expect(res.status).toBe(200)

    const upsertMock = vi.mocked(prisma.candidate.upsert)
    expect(upsertMock).toHaveBeenCalled()

    for (const call of upsertMock.mock.calls) {
      const arg = call[0]
      // Uniqueness constraint: where uses url + caseId composite
      expect(arg.where.url_caseId.caseId).toBe(CASE_ID)
      expect(typeof arg.where.url_caseId.url).toBe('string')
      // Status must be 'new' on create
      expect(arg.create).toMatchObject({ status: 'new', caseId: CASE_ID })
    }
  })

  it('deduplicates: calling the route twice for the same URL upserts, not inserts a duplicate row', async () => {
    const makeReq = () =>
      new Request(`http://localhost/api/cases/${CASE_ID}/search`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      })

    await POST(makeReq(), { params: { caseId: CASE_ID } })
    const firstCallCount = vi.mocked(prisma.candidate.upsert).mock.calls.length

    await POST(makeReq(), { params: { caseId: CASE_ID } })
    const secondCallCount = vi.mocked(prisma.candidate.upsert).mock.calls.length

    // Both runs upsert the same URLs — route uses upsert (not create) ensuring idempotency
    expect(secondCallCount).toBe(firstCallCount * 2)
    // Every call must use the upsert path, never a raw create
    for (const call of vi.mocked(prisma.candidate.upsert).mock.calls) {
      expect(call[0]).toHaveProperty('where.url_caseId')
    }
  })

  it('returns ≥1 normalized candidate object each with a resolvable url field', async () => {
    const req = new Request(`http://localhost/api/cases/${CASE_ID}/search`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })

    const res = await POST(req, { params: { caseId: CASE_ID } })
    expect(res.status).toBe(200)

    const body = await res.json() as { candidates: Array<{ url: string }> }
    expect(Array.isArray(body.candidates)).toBe(true)
    expect(body.candidates.length).toBeGreaterThanOrEqual(1)

    for (const candidate of body.candidates) {
      expect(typeof candidate.url).toBe('string')
      // URL must be resolvable (parseable absolute URL)
      expect(() => new URL(candidate.url)).not.toThrow()
    }
  })
})
