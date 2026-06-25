import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next/server before importing the route
vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), {
      ...init,
      headers: { 'content-type': 'application/json' },
    }),
  },
}))

// Mock Prisma so we can inspect calls without a real DB
const mockCreate = vi.fn()
vi.mock('../../src/lib/prisma', () => ({
  default: {
    evidence: {
      create: mockCreate,
    },
  },
}))

// Stub global fetch — the route must call it to retrieve the target page
const mockFetch = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>()

describe('POST /api/evidence', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    mockCreate.mockReset()
    mockFetch.mockReset()
  })

  it('fetches the target page, extracts title + domain, stamps detectedAt, and persists Evidence', async () => {
    const targetUrl = 'https://example.com/some/page'
    const caseId = 'case-abc-123'

    // The route should fetch the target URL and parse the HTML title
    mockFetch.mockResolvedValueOnce(
      new Response(
        '<html><head><title>Example Domain Title</title></head><body></body></html>',
        { status: 200, headers: { 'content-type': 'text/html' } },
      ),
    )

    const createdRow = {
      id: 'ev-1',
      url: targetUrl,
      pageTitle: 'Example Domain Title',
      domain: 'example.com',
      detectedAt: new Date(),
      caseId,
    }
    mockCreate.mockResolvedValueOnce(createdRow)

    const before = Date.now()

    // Import handler after mocks are in place
    const { POST } = await import('../../src/app/api/evidence/route')

    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      body: JSON.stringify({ url: targetUrl, caseId }),
      headers: { 'content-type': 'application/json' },
    })

    const res = await POST(req)
    expect(res.status).toBe(200)

    const after = Date.now()

    // (a) route fetched the target page server-side
    expect(mockFetch).toHaveBeenCalledOnce()
    const fetchedUrl = String(mockFetch.mock.calls[0]![0])
    expect(fetchedUrl).toBe(targetUrl)

    // (b) pageTitle parsed from <title> tag
    expect(mockCreate).toHaveBeenCalledOnce()
    const createArg = mockCreate.mock.calls[0]![0] as {
      data: {
        url: string
        pageTitle: string
        domain: string
        detectedAt: Date
        caseId: string
      }
    }
    expect(createArg.data.pageTitle).toBe('Example Domain Title')

    // (c) domain derived from URL hostname
    expect(createArg.data.domain).toBe('example.com')

    // (d) detectedAt stamped server-side (within the test window)
    const detectedMs = createArg.data.detectedAt.getTime()
    expect(detectedMs).toBeGreaterThanOrEqual(before)
    expect(detectedMs).toBeLessThanOrEqual(after)

    // (e) persisted with correct url and caseId
    expect(createArg.data.url).toBe(targetUrl)
    expect(createArg.data.caseId).toBe(caseId)

    const body = (await res.json()) as { id: string }
    expect(body.id).toBe('ev-1')
  })
})
