import { describe, it, expect, vi, beforeEach } from 'vitest'

const CASE_ID = 'case-route-triage-1'
const CANDIDATE_ID = 'cand-route-1'

const mockPrismaCandidate = {
  id: CANDIDATE_ID,
  caseId: CASE_ID,
  url: 'https://example.com/route-candidate',
  title: 'Route Candidate',
  snippet: 'Route snippet',
  status: 'pending',
  createdAt: new Date(),
}

const mockUpdate = vi.fn()
const mockFindMany = vi.fn()

vi.mock('../../src/lib/prisma', () => ({
  default: {
    candidate: {
      update: mockUpdate,
      findMany: mockFindMany,
    },
    evidence: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('candidate triage route — confirm sets status to evidence', () => {
  it('PATCH /api/cases/[caseId]/candidates/[candidateId] with status=evidence updates the Candidate row', async () => {
    const evidenceCandidate = { ...mockPrismaCandidate, status: 'evidence' }
    mockUpdate.mockResolvedValueOnce(evidenceCandidate)

    const { PATCH } = await import('../../src/app/api/cases/[caseId]/candidates/[candidateId]/route')

    const req = new Request(
      `http://localhost/api/cases/${CASE_ID}/candidates/${CANDIDATE_ID}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status: 'evidence' }),
        headers: { 'content-type': 'application/json' },
      },
    )

    const res = await PATCH(req, { params: { caseId: CASE_ID, candidateId: CANDIDATE_ID } })
    expect(res.status).toBe(200)

    const body = await res.json() as { status: string }
    expect(body.status).toBe('evidence')

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: CANDIDATE_ID }),
        data: expect.objectContaining({ status: 'evidence' }),
      }),
    )
  })

  it('PATCH with status=dismissed updates the Candidate row to dismissed', async () => {
    const dismissedCandidate = { ...mockPrismaCandidate, status: 'dismissed' }
    mockUpdate.mockResolvedValueOnce(dismissedCandidate)

    const { PATCH } = await import('../../src/app/api/cases/[caseId]/candidates/[candidateId]/route')

    const req = new Request(
      `http://localhost/api/cases/${CASE_ID}/candidates/${CANDIDATE_ID}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status: 'dismissed' }),
        headers: { 'content-type': 'application/json' },
      },
    )

    const res = await PATCH(req, { params: { caseId: CASE_ID, candidateId: CANDIDATE_ID } })
    expect(res.status).toBe(200)

    const body = await res.json() as { status: string }
    expect(body.status).toBe('dismissed')

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: CANDIDATE_ID }),
        data: expect.objectContaining({ status: 'dismissed' }),
      }),
    )
  })
})

describe('evidence route — only evidence-status candidates appear', () => {
  it('GET /api/evidence returns candidates with status=evidence and excludes dismissed ones', async () => {
    const evidenceCandidates = [
      { ...mockPrismaCandidate, status: 'evidence' },
    ]
    mockFindMany.mockResolvedValueOnce(evidenceCandidates)

    const { GET } = await import('../../src/app/api/evidence/route')

    const req = new Request('http://localhost/api/evidence', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(200)

    const body = await res.json() as Array<{ status: string; id: string }>
    const ids = body.map((e) => e.id)
    expect(ids).toContain(CANDIDATE_ID)

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'evidence' }),
      }),
    )
  })

  it('dismissed candidates are NOT returned by GET /api/evidence', async () => {
    mockFindMany.mockResolvedValueOnce([])

    const { GET } = await import('../../src/app/api/evidence/route')

    const req = new Request('http://localhost/api/evidence', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(200)

    const body = await res.json() as Array<{ id: string }>
    const ids = body.map((e) => e.id)
    expect(ids).not.toContain(CANDIDATE_ID)
  })
})

describe('export route — only evidence-status candidates appear in export', () => {
  it('GET /api/cases/[caseId]/export includes evidence candidates', async () => {
    const evidenceCandidates = [
      { ...mockPrismaCandidate, status: 'evidence' },
    ]
    mockFindMany.mockResolvedValueOnce(evidenceCandidates)

    const { GET } = await import('../../src/app/api/cases/[caseId]/export/route')

    const req = new Request(`http://localhost/api/cases/${CASE_ID}/export`, { method: 'GET' })
    const res = await GET(req, { params: { caseId: CASE_ID } })
    expect(res.status).toBe(200)

    const text = await res.text()
    expect(text).toContain(CANDIDATE_ID)
  })

  it('GET /api/cases/[caseId]/export excludes dismissed candidates', async () => {
    mockFindMany.mockResolvedValueOnce([])

    const { GET } = await import('../../src/app/api/cases/[caseId]/export/route')

    const req = new Request(`http://localhost/api/cases/${CASE_ID}/export`, { method: 'GET' })
    const res = await GET(req, { params: { caseId: CASE_ID } })
    expect(res.status).toBe(200)

    const text = await res.text()
    expect(text).not.toContain(CANDIDATE_ID)
  })
})
