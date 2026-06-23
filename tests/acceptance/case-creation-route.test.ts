import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../../src/app/api/cases/route'

const mockCreate = vi.fn()
const mockFindMany = vi.fn()

vi.mock('../../src/lib/db', () => ({
  prisma: {
    case: {
      create: mockCreate,
      findMany: mockFindMany,
    },
  },
}))

const makeRequest = (body: unknown) =>
  new Request('http://localhost/api/cases', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })

describe('POST /api/cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('persists a new Case row when identifyingTerms is non-empty', async () => {
    mockCreate.mockResolvedValue({ id: 1, identifyingTerms: 'Jane Smith 1990' })

    const res = await POST(makeRequest({ identifyingTerms: 'Jane Smith 1990' }))

    expect(res.status).toBe(201)
    expect(mockCreate).toHaveBeenCalledWith({
      data: { identifyingTerms: 'Jane Smith 1990' },
    })
    const json = await res.json() as { id: number; identifyingTerms: string }
    expect(json.identifyingTerms).toBe('Jane Smith 1990')
  })

  it('returns 400 and writes no row when identifyingTerms is empty string', async () => {
    const res = await POST(makeRequest({ identifyingTerms: '' }))

    expect(res.status).toBe(400)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('returns 400 and writes no row when identifyingTerms is whitespace-only', async () => {
    const res = await POST(makeRequest({ identifyingTerms: '   ' }))

    expect(res.status).toBe(400)
    expect(mockCreate).not.toHaveBeenCalled()
  })
})
