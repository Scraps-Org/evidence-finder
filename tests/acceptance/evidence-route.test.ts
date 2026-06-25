import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ---------------------------------------------------------------------------
// Stub prisma BEFORE importing the route so the module resolver picks up mocks
// ---------------------------------------------------------------------------
const mockCreate = vi.fn<[{ data: { url: string; caseId: string; pageTitle: string; domain: string; detectedAt: Date } }], Promise<{ id: string; url: string; caseId: string; pageTitle: string; domain: string; detectedAt: Date }>>()

vi.mock('../../src/lib/prisma', () => ({
  default: {
    evidence: {
      create: mockCreate,
    },
  },
}))

// ---------------------------------------------------------------------------
// Stub global fetch so the route can "fetch" a page without real network I/O
// ---------------------------------------------------------------------------
const mockFetch = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>()

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch)
  mockCreate.mockReset()
  mockFetch.mockReset()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('POST /api/evidence — server route handler', () => {
  it('fetches the target page, extracts <title> + domain, stamps detectedAt, and persists an Evidence row', async () => {
    const targetUrl = 'https://example.com/some/path'
    const caseId = 'case-abc-123'
    const htmlWithTitle = '<html><head><title>Example Domain</title></head><body>hello</body></html>'

    // Simulate a successful page fetch
    mockFetch.mockResolvedValueOnce(
      new Response(htmlWithTitle, {
        status: 200,
        headers: { 'content-type': 'text/html' },
      }),
    )

    const savedRow = {
      id: 'ev-1',
      url: targetUrl,
      caseId,
      pageTitle: 'Example Domain',
      domain: 'example.com',
      detectedAt: new Date(),
    }
    mockCreate.mockResolvedValueOnce(savedRow)

    const before = new Date()

    // Import the handler AFTER stubs are in place
    const { POST } = await import('../../src/app/api/evidence/route')

    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      body: JSON.stringify({ url: targetUrl, caseId }),
      headers: { 'content-type': 'application/json' },
    })

    const res = await POST(req)
    const after = new Date()

    // (a) Route must have fetched the target URL server-side
    expect(mockFetch).toHaveBeenCalledTimes(1)
    const fetchedArg = mockFetch.mock.calls[0]![0]
    const fetchedUrl = typeof fetchedArg === 'string' ? fetchedArg : fetchedArg instanceof URL ? fetchedArg.href : (fetchedArg as Request).url
    expect(fetchedUrl).toContain('example.com')

    // (b)(c)(d)(e) Prisma create must have been called with correct shape
    expect(mockCreate).toHaveBeenCalledTimes(1)
    const createCall = mockCreate.mock.calls[0]![0]
    // (b) pageTitle extracted from <title>
    expect(createCall.data.pageTitle).toBe('Example Domain')
    // (c) domain derived from URL hostname
    expect(createCall.data.domain).toBe('example.com')
    // (d) detectedAt is a Date stamped on the server side within the request window
    expect(createCall.data.detectedAt).toBeInstanceOf(Date)
    expect(createCall.data.detectedAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(createCall.data.detectedAt.getTime()).toBeLessThanOrEqual(after.getTime())
    // (e) url and caseId forwarded
    expect(createCall.data.url).toBe(targetUrl)
    expect(createCall.data.caseId).toBe(caseId)

    // Route must return a success status
    expect(res.status).toBeGreaterThanOrEqual(200)
    expect(res.status).toBeLessThan(300)
  })
})
