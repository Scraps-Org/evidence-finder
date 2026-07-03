import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock prisma before importing the route
const mockCreate = vi.fn()
vi.mock('../../src/lib/prisma', () => ({
  default: { evidence: { create: mockCreate } },
}))

// Mock fetch so the route does a server-side HTTP fetch to extract metadata
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('POST /api/evidence — URL add route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates an Evidence row with all five non-null fields when a URL is submitted', async () => {
    const targetUrl = 'https://example.com/exposure-post'
    const caseId = 'case-abc-123'

    // The route must fetch the target URL server-side to extract metadata
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () =>
        '<html><head><title>Exposure Post Title</title></head><body></body></html>',
    })

    const storedAt = new Date()
    mockCreate.mockResolvedValueOnce({
      id: 'ev-1',
      url: targetUrl,
      pageTitle: 'Exposure Post Title',
      domain: 'example.com',
      detectedAt: storedAt,
      caseId,
    })

    const { POST } = await import('../../src/app/api/evidence/route')

    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: targetUrl, caseId }),
    })

    const res = await POST(req)
    expect(res.status).toBe(201)

    const body = await res.json() as {
      id: string
      url: string
      pageTitle: string
      domain: string
      detectedAt: string
      caseId: string
    }

    // All five required fields must be non-null in the response
    expect(body.url).toBe(targetUrl)
    expect(body.pageTitle).toBeTruthy()
    expect(body.domain).toBeTruthy()
    expect(body.detectedAt).toBeTruthy()
    expect(body.caseId).toBe(caseId)
  })

  it('performs a server-side fetch of the target URL to extract pageTitle and domain', async () => {
    const targetUrl = 'https://badsite.net/page/123'
    const caseId = 'case-xyz-456'

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () =>
        '<html><head><title>Bad Site Page</title></head><body></body></html>',
    })

    mockCreate.mockResolvedValueOnce({
      id: 'ev-2',
      url: targetUrl,
      pageTitle: 'Bad Site Page',
      domain: 'badsite.net',
      detectedAt: new Date(),
      caseId,
    })

    const { POST } = await import('../../src/app/api/evidence/route')

    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: targetUrl, caseId }),
    })

    await POST(req)

    // The route must have called fetch with the exact target URL (server-side scrape)
    expect(mockFetch).toHaveBeenCalledWith(targetUrl)

    // The prisma create call must receive pageTitle parsed from <title>, domain from URL, and a timestamp
    const createCall = mockCreate.mock.calls[0] as [{
      data: {
        url: string
        pageTitle: string
        domain: string
        detectedAt: Date
        caseId: string
      }
    }]
    const data = createCall[0].data
    expect(data.pageTitle).toBe('Bad Site Page')
    expect(data.domain).toBe('badsite.net')
    expect(data.detectedAt).toBeInstanceOf(Date)
    expect(data.url).toBe(targetUrl)
    expect(data.caseId).toBe(caseId)
  })
})
