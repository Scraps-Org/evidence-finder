import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('POST /api/evidence — server-side fetch, metadata extraction, persistence', () => {
  const CASE_ID = 'case-test-001'
  const TARGET_URL = 'https://example.com/page'
  const PAGE_TITLE = 'Example Exposure Page'

  let fetchSpy: ReturnType<typeof vi.fn>
  let createdEvidence: {
    url: string
    detectedAt: Date
    pageTitle: string
    domain: string
    caseId: string
  } | null = null

  beforeEach(() => {
    // Spy on global fetch to verify server-side HTTP fetch of target URL
    fetchSpy = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>()
    fetchSpy.mockResolvedValue(
      new Response(
        `<html><head><title>${PAGE_TITLE}</title></head><body></body></html>`,
        { status: 200, headers: { 'content-type': 'text/html' } },
      ),
    )
    vi.stubGlobal('fetch', fetchSpy)

    // Mock prisma to capture the create call without a real DB
    vi.mock('../../src/lib/prisma', () => ({
      default: {
        evidence: {
          create: vi.fn<
            [{ data: { url: string; detectedAt: Date; pageTitle: string; domain: string; caseId: string } }],
            Promise<{ url: string; detectedAt: Date; pageTitle: string; domain: string; caseId: string; id: string }>
          >(async ({ data }) => {
            createdEvidence = { ...data }
            return { id: 'ev-001', ...data }
          }),
        },
      },
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    createdEvidence = null
  })

  it('creates an Evidence row with all five fields non-null when a URL is submitted', async () => {
    const { POST } = await import('../../src/app/api/evidence/route')

    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      body: JSON.stringify({ url: TARGET_URL, caseId: CASE_ID }),
      headers: { 'content-type': 'application/json' },
    })

    const res = await POST(req)
    expect(res.status).toBe(201)

    expect(createdEvidence).not.toBeNull()
    const ev = createdEvidence!
    expect(ev.url).toBeTruthy()
    expect(ev.detectedAt).toBeTruthy()
    expect(ev.pageTitle).toBeTruthy()
    expect(ev.domain).toBeTruthy()
    expect(ev.caseId).toBeTruthy()
  })

  it('stores the submitted URL verbatim', async () => {
    const { POST } = await import('../../src/app/api/evidence/route')

    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      body: JSON.stringify({ url: TARGET_URL, caseId: CASE_ID }),
      headers: { 'content-type': 'application/json' },
    })

    await POST(req)
    expect(createdEvidence!.url).toBe(TARGET_URL)
    expect(createdEvidence!.caseId).toBe(CASE_ID)
  })

  it('server fetches the target URL to extract pageTitle and domain', async () => {
    const { POST } = await import('../../src/app/api/evidence/route')

    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      body: JSON.stringify({ url: TARGET_URL, caseId: CASE_ID }),
      headers: { 'content-type': 'application/json' },
    })

    await POST(req)

    // The route must have called fetch with the target URL (server-side)
    const fetchedUrls = fetchSpy.mock.calls.map((c) => String(c[0]))
    expect(fetchedUrls).toContain(TARGET_URL)
  })

  it('parses pageTitle from the HTML <title> tag of the fetched page', async () => {
    const { POST } = await import('../../src/app/api/evidence/route')

    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      body: JSON.stringify({ url: TARGET_URL, caseId: CASE_ID }),
      headers: { 'content-type': 'application/json' },
    })

    await POST(req)
    expect(createdEvidence!.pageTitle).toBe(PAGE_TITLE)
  })

  it('derives domain from URL parsing (not from the fetched body)', async () => {
    const { POST } = await import('../../src/app/api/evidence/route')

    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      body: JSON.stringify({ url: TARGET_URL, caseId: CASE_ID }),
      headers: { 'content-type': 'application/json' },
    })

    await POST(req)
    expect(createdEvidence!.domain).toBe('example.com')
  })

  it('stamps detectedAt as a server-side Date at time of route execution', async () => {
    const before = new Date()
    const { POST } = await import('../../src/app/api/evidence/route')

    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      body: JSON.stringify({ url: TARGET_URL, caseId: CASE_ID }),
      headers: { 'content-type': 'application/json' },
    })

    await POST(req)
    const after = new Date()

    const detectedAt = createdEvidence!.detectedAt
    expect(detectedAt).toBeInstanceOf(Date)
    expect(detectedAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(detectedAt.getTime()).toBeLessThanOrEqual(after.getTime())
  })
})
