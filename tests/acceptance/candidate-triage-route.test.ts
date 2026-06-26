import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock prisma before importing the route so it uses the mock
const mockCandidateUpdate = vi.fn<
  [{ where: { id: string }; data: { status: string } }],
  Promise<{ id: string; status: string }>
>()
const mockCandidateFindMany = vi.fn<
  [{ where: { caseId: string } }],
  Promise<{ id: string; caseId: string; url: string; title: string; status: string }[]>
>()
const mockCandidateFindFirst = vi.fn<
  [{ where: { id: string } }],
  Promise<{ id: string; caseId: string; url: string; title: string; status: string } | null>
>()

vi.mock('../../src/lib/prisma', () => ({
  default: {
    candidate: {
      update: mockCandidateUpdate,
      findMany: mockCandidateFindMany,
      findFirst: mockCandidateFindFirst,
    },
  },
}))

import { PATCH } from '../../src/app/api/candidates/[candidateId]/route'
import { GET as getCandidates } from '../../src/app/api/cases/[caseId]/candidates/route'

const CANDIDATE_ROW = {
  id: 'cand-1',
  caseId: 'case-abc',
  url: 'https://example.com/page',
  title: 'Test page',
  status: 'pending',
}

beforeEach(() => {
  vi.clearAllMocks()
  mockCandidateFindMany.mockResolvedValue([CANDIDATE_ROW])
  mockCandidateFindFirst.mockResolvedValue(CANDIDATE_ROW)
})

describe('D8 candidate triage route — confirm', () => {
  it('sets status to evidence when confirm action is triggered', async () => {
    mockCandidateUpdate.mockResolvedValue({ ...CANDIDATE_ROW, status: 'evidence' })
    const req = new Request('http://t/api/candidates/cand-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'evidence' }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await PATCH(req, { params: Promise.resolve({ candidateId: 'cand-1' }) })
    expect(res.status).toBe(200)
    expect(mockCandidateUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'cand-1' },
        data: expect.objectContaining({ status: 'evidence' }),
      }),
    )
  })
})

describe('D8 candidate triage route — dismiss', () => {
  it('sets status to dismissed when dismiss action is triggered', async () => {
    mockCandidateUpdate.mockResolvedValue({ ...CANDIDATE_ROW, status: 'dismissed' })
    const req = new Request('http://t/api/candidates/cand-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'dismissed' }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await PATCH(req, { params: Promise.resolve({ candidateId: 'cand-1' }) })
    expect(res.status).toBe(200)
    expect(mockCandidateUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'cand-1' },
        data: expect.objectContaining({ status: 'dismissed' }),
      }),
    )
  })
})

describe('D8 evidence list (D3) — only evidence candidates appear', () => {
  it('includes status=evidence candidates in the evidence list', async () => {
    mockCandidateFindMany.mockResolvedValue([
      { ...CANDIDATE_ROW, status: 'evidence' },
    ])
    const req = new Request('http://t/api/evidence?caseId=case-abc', { method: 'GET' })
    const { GET } = await import('../../src/app/api/evidence/route')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json() as { id: string; status: string }[]
    expect(body.some((item) => item.id === 'cand-1')).toBe(true)
  })

  it('excludes status=dismissed candidates from the evidence list', async () => {
    mockCandidateFindMany.mockResolvedValue([
      { ...CANDIDATE_ROW, status: 'dismissed' },
    ])
    const req = new Request('http://t/api/evidence?caseId=case-abc', { method: 'GET' })
    const { GET } = await import('../../src/app/api/evidence/route')
    const res = await GET(req)
    const body = await res.json() as { id: string; status: string }[]
    expect(body.some((item) => item.id === 'cand-1')).toBe(false)
  })
})

describe('D8 export (D5) — evidence candidates appear in export', () => {
  it('includes status=evidence candidate in the CSV/JSON export', async () => {
    mockCandidateFindMany.mockResolvedValue([
      { ...CANDIDATE_ROW, status: 'evidence' },
    ])
    const req = new Request('http://t/api/cases/case-abc/export', { method: 'GET' })
    const { GET } = await import('../../src/app/api/cases/[caseId]/export/route')
    const res = await GET(req, { params: Promise.resolve({ caseId: 'case-abc' }) })
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toContain('cand-1')
  })

  it('excludes status=dismissed candidate from the CSV/JSON export', async () => {
    mockCandidateFindMany.mockResolvedValue([])
    const req = new Request('http://t/api/cases/case-abc/export', { method: 'GET' })
    const { GET } = await import('../../src/app/api/cases/[caseId]/export/route')
    const res = await GET(req, { params: Promise.resolve({ caseId: 'case-abc' }) })
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).not.toContain('cand-1')
  })
})
