import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('POST /api/evidence — server-side fetch and metadata extraction', () => {
  const CASE_ID = 'test-case-001'
  const TARGET_URL = 'https://example-exposure-site.com/path/to/post'
  const FAKE_TITLE = 'Exposed Content Page'
  const FAKE_HTML = `<!DOCTYPE html><html><head><title>${FAKE_TITLE}</title></head><body></body></html>`

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
        new Response(FAKE_HTML, {
          status: 200,
          headers: { 'content-type': 'text/html' },
        })
      )
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetAllMocks()
  })

  it('fetches the target URL on the server and extracts pageTitle from <title> tag', async () => {
    const { POST } = await import('../../src/app/api/evidence/route')

    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      body: JSON.stringify({ url: TARGET_URL, caseId: CASE_ID }),
      headers: { 'content-type': 'application/json' },
    })

    const before = new Date()
    const res = await POST(req)
    const after = new Date()

    expect(res.status).toBe(200)
    const body = await res.json() as Record<string, unknown>

    // pageTitle extracted from <title>
    expect(body.pageTitle).toBe(FAKE_TITLE)

    // domain derived from URL parsing
    expect(body.domain).toBe('example-exposure-site.com')

    // detectedAt is a server-side timestamp recorded at fetch time
    const detectedAt = new Date(body.detectedAt as string)
    expect(detectedAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(detectedAt.getTime()).toBeLessThanOrEqual(after.getTime())

    // url and caseId are persisted
    expect(body.url).toBe(TARGET_URL)
    expect(body.caseId).toBe(CASE_ID)

    // server actually fetched the target URL (not the client)
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      TARGET_URL,
      expect.anything()
    )
  })

  it('all five required fields are non-null in the response', async () => {
    const { POST } = await import('../../src/app/api/evidence/route')

    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      body: JSON.stringify({ url: TARGET_URL, caseId: CASE_ID }),
      headers: { 'content-type': 'application/json' },
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json() as Record<string, unknown>

    const requiredFields = ['url', 'detectedAt', 'pageTitle', 'domain', 'caseId'] as const
    for (const field of requiredFields) {
      expect(body[field], `field '${field}' must be non-null`).not.toBeNull()
      expect(body[field], `field '${field}' must be defined`).toBeDefined()
    }
  })
})
