import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { POST } from '../../src/app/api/evidence/route'

const CASE_ID = 'case-test-001'
const TARGET_URL = 'https://example.com/exposure-post'
const PAGE_TITLE = 'Exposure Page Title'

describe('POST /api/evidence — URL submission creates Evidence with all five fields', () => {
  const createdRows: unknown[] = []

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
        new Response(
          `<html><head><title>${PAGE_TITLE}</title></head><body></body></html>`,
          { status: 200, headers: { 'content-type': 'text/html' } },
        ),
      ),
    )

    vi.mock('../../src/lib/prisma', () => {
      const evidence = {
        create: vi.fn(async (args: { data: Record<string, unknown> }) => {
          const row = { id: 'ev-1', ...args.data }
          createdRows.push(row)
          return row
        }),
      }
      return { default: { evidence } }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    createdRows.length = 0
  })

  it('creates an Evidence row with url, detectedAt, pageTitle, domain, and caseId all non-null', async () => {
    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: TARGET_URL, caseId: CASE_ID }),
    })

    const res = await POST(req)
    expect(res.status).toBe(201)

    const body = await res.json() as Record<string, unknown>

    expect(body.url).toBe(TARGET_URL)
    expect(body.caseId).toBe(CASE_ID)
    expect(typeof body.pageTitle).toBe('string')
    expect((body.pageTitle as string).length).toBeGreaterThan(0)
    expect(typeof body.domain).toBe('string')
    expect((body.domain as string).length).toBeGreaterThan(0)
    expect(body.detectedAt).not.toBeNull()
    expect(body.detectedAt).toBeDefined()
  })

  it('fetches the target URL on the server side and parses <title> as pageTitle', async () => {
    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: TARGET_URL, caseId: CASE_ID }),
    })

    await POST(req)

    const globalFetch = vi.mocked(globalThis.fetch)
    expect(globalFetch).toHaveBeenCalledOnce()
    const calledUrl = globalFetch.mock.calls[0]?.[0]
    expect(calledUrl).toBe(TARGET_URL)

    const res2 = await POST(
      new Request('http://localhost/api/evidence', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: TARGET_URL, caseId: CASE_ID }),
      }),
    )
    const body2 = await res2.json() as Record<string, unknown>
    expect(body2.pageTitle).toBe(PAGE_TITLE)
  })

  it('derives domain from URL parsing and records a server-side detectedAt timestamp', async () => {
    const before = new Date()

    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: TARGET_URL, caseId: CASE_ID }),
    })

    const res = await POST(req)
    const after = new Date()

    const body = await res.json() as Record<string, unknown>

    expect(body.domain).toBe('example.com')

    const detectedAt = new Date(body.detectedAt as string)
    expect(detectedAt.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000)
    expect(detectedAt.getTime()).toBeLessThanOrEqual(after.getTime() + 1000)
  })
})
