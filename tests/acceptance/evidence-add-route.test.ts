import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockPrismaCreate = vi.fn()
const mockFetch = vi.fn()

vi.mock('../../src/lib/prisma', () => ({
  default: {
    evidence: {
      create: mockPrismaCreate,
    },
  },
}))

vi.stubGlobal('fetch', mockFetch)

describe('POST /api/evidence — server-side fetch, parse, and persist', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches the target URL server-side and persists all five fields non-null', async () => {
    const targetUrl = 'https://example.com/some-post'
    const caseId = 'case-abc-123'
    const fakeHtml = '<html><head><title>Exposed Page Title</title></head><body></body></html>'

    mockFetch.mockResolvedValueOnce({
      text: async () => fakeHtml,
      ok: true,
    } as unknown as Response)

    const createdAt = new Date('2026-07-03T00:00:00.000Z')
    mockPrismaCreate.mockResolvedValueOnce({
      id: 'ev-1',
      url: targetUrl,
      detectedAt: createdAt,
      pageTitle: 'Exposed Page Title',
      domain: 'example.com',
      caseId,
    })

    const { POST } = await import('../../src/app/api/evidence/route')

    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      body: JSON.stringify({ url: targetUrl, caseId }),
      headers: { 'content-type': 'application/json' },
    })

    const res = await POST(req)
    expect(res.status).toBe(201)

    const body = await res.json() as Record<string, unknown>

    // Server must have fetched the target URL (not the client)
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(targetUrl)

    // Prisma must have been called with all five non-null fields
    expect(mockPrismaCreate).toHaveBeenCalledTimes(1)
    const createArg = mockPrismaCreate.mock.calls[0]?.[0] as {
      data: {
        url: string
        detectedAt: Date
        pageTitle: string
        domain: string
        caseId: string
      }
    }
    expect(createArg.data.url).toBe(targetUrl)
    expect(createArg.data.pageTitle).toBe('Exposed Page Title')
    expect(createArg.data.domain).toBe('example.com')
    expect(createArg.data.caseId).toBe(caseId)
    expect(createArg.data.detectedAt).toBeInstanceOf(Date)

    // Response body echoes the persisted row with all five fields
    expect(body.url).toBe(targetUrl)
    expect(body.pageTitle).toBe('Exposed Page Title')
    expect(body.domain).toBe('example.com')
    expect(body.caseId).toBe(caseId)
    expect(body.detectedAt).toBeTruthy()
  })

  it('derives domain from the submitted URL via URL parsing, not from the fetched HTML', async () => {
    const targetUrl = 'https://sub.harmful-site.kr/path?q=1'
    const caseId = 'case-xyz-999'
    const fakeHtml = '<html><head><title>Some Title</title></head></html>'

    mockFetch.mockResolvedValueOnce({
      text: async () => fakeHtml,
      ok: true,
    } as unknown as Response)

    mockPrismaCreate.mockResolvedValueOnce({
      id: 'ev-2',
      url: targetUrl,
      detectedAt: new Date(),
      pageTitle: 'Some Title',
      domain: 'sub.harmful-site.kr',
      caseId,
    })

    const { POST } = await import('../../src/app/api/evidence/route')

    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      body: JSON.stringify({ url: targetUrl, caseId }),
      headers: { 'content-type': 'application/json' },
    })

    await POST(req)

    const createArg = mockPrismaCreate.mock.calls[0]?.[0] as {
      data: { domain: string }
    }
    expect(createArg.data.domain).toBe('sub.harmful-site.kr')
  })

  it('stamps detectedAt with a server-side timestamp at fetch time (not from request body)', async () => {
    const before = Date.now()
    const targetUrl = 'https://example.org/page'
    const caseId = 'case-ts-001'
    const fakeHtml = '<html><head><title>Title</title></head></html>'

    mockFetch.mockResolvedValueOnce({
      text: async () => fakeHtml,
      ok: true,
    } as unknown as Response)

    let capturedDetectedAt: Date | undefined
    mockPrismaCreate.mockImplementationOnce(async (arg: { data: { detectedAt: Date; url: string; pageTitle: string; domain: string; caseId: string } }) => {
      capturedDetectedAt = arg.data.detectedAt
      return {
        id: 'ev-3',
        url: targetUrl,
        detectedAt: capturedDetectedAt,
        pageTitle: 'Title',
        domain: 'example.org',
        caseId,
      }
    })

    const { POST } = await import('../../src/app/api/evidence/route')

    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      body: JSON.stringify({ url: targetUrl, caseId }),
      headers: { 'content-type': 'application/json' },
    })

    await POST(req)
    const after = Date.now()

    expect(capturedDetectedAt).toBeInstanceOf(Date)
    expect(capturedDetectedAt!.getTime()).toBeGreaterThanOrEqual(before)
    expect(capturedDetectedAt!.getTime()).toBeLessThanOrEqual(after)
  })
})
