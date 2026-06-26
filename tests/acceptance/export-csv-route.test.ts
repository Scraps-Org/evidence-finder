import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ---------------------------------------------------------------------------
// Prisma mock
// ---------------------------------------------------------------------------
const evidenceCandidate = {
  id: 'cand-exp-001',
  caseId: 'case-exp-001',
  url: 'https://example.com/export-article',
  title: 'Export Evidence Article',
  snippet: 'Export evidence snippet',
  status: 'evidence',
}

const dismissedCandidate = {
  id: 'cand-exp-002',
  caseId: 'case-exp-001',
  url: 'https://example.com/export-dismissed',
  title: 'Export Dismissed Article',
  snippet: 'Dismissed',
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

describe('D5 export route — candidate status filter', () => {
  beforeEach(() => {
    prismaFindManyMock.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('GET /api/cases/[caseId]/export includes candidates with status=evidence', async () => {
    prismaFindManyMock.mockResolvedValue([evidenceCandidate])

    const mod = await import('../../src/app/api/cases/[caseId]/export/route').catch(() => null)
    if (!mod) {
      expect(true, 'Export route not yet implemented').toBe(false)
      return
    }

    const { GET } = mod as { GET: (req: Request, ctx: { params: { caseId: string } }) => Promise<Response> }

    const res = await GET(
      new Request(`http://localhost/api/cases/${evidenceCandidate.caseId}/export`, { method: 'GET' }),
      { params: { caseId: evidenceCandidate.caseId } },
    )

    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toContain(evidenceCandidate.id)
  })

  it('GET /api/cases/[caseId]/export excludes candidates with status=dismissed', async () => {
    prismaFindManyMock.mockResolvedValue([])

    const mod = await import('../../src/app/api/cases/[caseId]/export/route').catch(() => null)
    if (!mod) {
      expect(true, 'Export route not yet implemented').toBe(false)
      return
    }

    const { GET } = mod as { GET: (req: Request, ctx: { params: { caseId: string } }) => Promise<Response> }

    const res = await GET(
      new Request(`http://localhost/api/cases/${dismissedCandidate.caseId}/export`, { method: 'GET' }),
      { params: { caseId: dismissedCandidate.caseId } },
    )

    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).not.toContain(dismissedCandidate.id)

    expect(prismaFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'evidence' }) as unknown,
      }),
    )
  })
})
