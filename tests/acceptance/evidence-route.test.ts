import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ---------------------------------------------------------------------------
// Prisma mock
// ---------------------------------------------------------------------------
const evidenceCandidate = {
  id: 'cand-ev-001',
  caseId: 'case-ev-001',
  url: 'https://example.com/evidence-article',
  title: 'Evidence Article',
  snippet: 'Evidence snippet',
  status: 'evidence',
}

const dismissedCandidate = {
  id: 'cand-ev-002',
  caseId: 'case-ev-001',
  url: 'https://example.com/dismissed-article',
  title: 'Dismissed Article',
  snippet: 'Dismissed snippet',
  status: 'dismissed',
}

const prismaFindManyMock = vi.fn<[unknown], Promise<typeof evidenceCandidate[]>>()

vi.mock('../../src/lib/prisma', () => ({
  default: {
    candidate: {
      findMany: prismaFindManyMock,
    },
    evidence: {
      findMany: prismaFindManyMock,
    },
  },
}))

describe('D3 evidence route — candidate status filter', () => {
  beforeEach(() => {
    prismaFindManyMock.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('GET /api/evidence includes candidates with status=evidence', async () => {
    prismaFindManyMock.mockResolvedValue([evidenceCandidate])

    const mod = await import('../../src/app/api/evidence/route').catch(() => null)
    if (!mod) {
      expect(true, 'Evidence route not yet implemented').toBe(false)
      return
    }

    const { GET } = mod as { GET: (req: Request) => Promise<Response> }

    const res = await GET(
      new Request('http://localhost/api/evidence?caseId=case-ev-001', { method: 'GET' }),
    )

    expect(res.status).toBe(200)
    const body = await res.json() as Array<{ id: string; status: string }>
    const ids = body.map((item) => item.id)
    expect(ids).toContain(evidenceCandidate.id)
  })

  it('GET /api/evidence excludes candidates with status=dismissed', async () => {
    // Route must query only evidence-status rows; mock returns only the dismissed one
    // to verify it does NOT appear — the route should filter at DB level (WHERE status='evidence')
    // and the mock call arg should reflect that filter.
    prismaFindManyMock.mockResolvedValue([])

    const mod = await import('../../src/app/api/evidence/route').catch(() => null)
    if (!mod) {
      expect(true, 'Evidence route not yet implemented').toBe(false)
      return
    }

    const { GET } = mod as { GET: (req: Request) => Promise<Response> }

    const res = await GET(
      new Request('http://localhost/api/evidence?caseId=case-ev-001', { method: 'GET' }),
    )

    expect(res.status).toBe(200)
    const body = await res.json() as Array<{ id: string }>
    const ids = body.map((item) => item.id)
    expect(ids).not.toContain(dismissedCandidate.id)

    // The route must have queried with a status filter
    expect(prismaFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'evidence' }) as unknown,
      }),
    )
  })
})
