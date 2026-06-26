import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ---------------------------------------------------------------------------
// Prisma mock — must be hoisted before any import that transitively pulls prisma
// ---------------------------------------------------------------------------
const mockCandidate = {
  id: 'cand-route-001',
  caseId: 'case-route-001',
  url: 'https://example.com/route-article',
  title: 'Route Article',
  snippet: 'Snippet',
  status: 'pending',
}

const prismaUpdateMock = vi.fn<[unknown], Promise<typeof mockCandidate>>()
const prismaFindManyMock = vi.fn<[unknown], Promise<typeof mockCandidate[]>>()

vi.mock('../../src/lib/prisma', () => ({
  default: {
    candidate: {
      update: prismaUpdateMock,
      findMany: prismaFindManyMock,
    },
  },
}))

describe('D8 candidate triage route — confirm action', () => {
  beforeEach(() => {
    prismaUpdateMock.mockReset()
    prismaFindManyMock.mockReset()
    prismaUpdateMock.mockResolvedValue({ ...mockCandidate, status: 'evidence' })
    prismaFindManyMock.mockResolvedValue([mockCandidate])
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('PATCH /api/cases/[caseId]/candidates/[candidateId] with status=evidence updates the Candidate row', async () => {
    // Dynamically import the route handler AFTER mocks are in place.
    // The route does not exist yet — the coder writes it; this test defines the contract.
    const mod = await import('../../src/app/api/cases/[caseId]/candidates/[candidateId]/route').catch(() => null)
    if (!mod) {
      // Route not yet implemented — assert the mock is wired but skip execution
      // so the test fails only at the handler assertion level, not at import.
      expect(true, 'Route handler not yet implemented — coder must create it').toBe(false)
      return
    }

    const { PATCH } = mod as { PATCH: (req: Request, ctx: { params: { caseId: string; candidateId: string } }) => Promise<Response> }

    const req = new Request(
      `http://localhost/api/cases/${mockCandidate.caseId}/candidates/${mockCandidate.id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status: 'evidence' }),
        headers: { 'content-type': 'application/json' },
      },
    )

    const res = await PATCH(req, { params: { caseId: mockCandidate.caseId, candidateId: mockCandidate.id } })

    expect(res.status).toBe(200)
    expect(prismaUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: mockCandidate.id }) as unknown,
        data: expect.objectContaining({ status: 'evidence' }) as unknown,
      }),
    )

    const body = await res.json() as { status: string }
    expect(body.status).toBe('evidence')
  })

  it('PATCH /api/cases/[caseId]/candidates/[candidateId] with status=dismissed sets status to dismissed', async () => {
    prismaUpdateMock.mockResolvedValue({ ...mockCandidate, status: 'dismissed' })

    const mod = await import('../../src/app/api/cases/[caseId]/candidates/[candidateId]/route').catch(() => null)
    if (!mod) {
      expect(true, 'Route handler not yet implemented — coder must create it').toBe(false)
      return
    }

    const { PATCH } = mod as { PATCH: (req: Request, ctx: { params: { caseId: string; candidateId: string } }) => Promise<Response> }

    const req = new Request(
      `http://localhost/api/cases/${mockCandidate.caseId}/candidates/${mockCandidate.id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status: 'dismissed' }),
        headers: { 'content-type': 'application/json' },
      },
    )

    const res = await PATCH(req, { params: { caseId: mockCandidate.caseId, candidateId: mockCandidate.id } })

    expect(res.status).toBe(200)
    expect(prismaUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: mockCandidate.id }) as unknown,
        data: expect.objectContaining({ status: 'dismissed' }) as unknown,
      }),
    )

    const body = await res.json() as { status: string }
    expect(body.status).toBe('dismissed')
  })
})
