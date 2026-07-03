import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock prisma before importing the route so the route uses the mock
vi.mock('../../src/lib/prisma', () => {
  const mockCreate = vi.fn()
  return {
    default: {
      evidence: {
        create: mockCreate,
      },
    },
  }
})

// Mock global fetch so the route's server-side fetch is intercepted
const mockFetch = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>()
vi.stubGlobal('fetch', mockFetch)

import { POST } from '../../src/app/api/evidence/route'
import prisma from '../../src/lib/prisma'

const mockedCreate = vi.mocked(prisma.evidence.create)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/evidence — server-side fetch, parse, and persist', () => {
  it('fetches the submitted URL server-side and creates an Evidence row with all five fields non-null', async () => {
    const targetUrl = 'https://example.com/exposure-post'
    const caseId = 'case-abc-123'
    const fakeHtml = '<html><head><title>Exposure Post Title</title></head><body></body></html>'

    mockFetch.mockResolvedValueOnce(
      new Response(fakeHtml, {
        status: 200,
        headers: { 'content-type': 'text/html' },
      }),
    )

    const createdRow = {
      id: 'ev-1',
      url: targetUrl,
      pageTitle: 'Exposure Post Title',
      domain: 'example.com',
      detectedAt: new Date('2026-07-03T00:00:00Z'),
      caseId,
    }
    mockedCreate.mockResolvedValueOnce(createdRow)

    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      body: JSON.stringify({ url: targetUrl, caseId }),
      headers: { 'content-type': 'application/json' },
    })

    const before = Date.now()
    const res = await POST(req)
    const after = Date.now()

    expect(res.status).toBe(201)

    // The route must have called fetch with the target URL (server-side fetch)
    expect(mockFetch).toHaveBeenCalledOnce()
    const fetchedArg = mockFetch.mock.calls[0]![0]
    expect(String(fetchedArg)).toBe(targetUrl)

    // prisma.evidence.create must have been called with all five fields
    expect(mockedCreate).toHaveBeenCalledOnce()
    const createArg = mockedCreate.mock.calls[0]![0] as {
      data: {
        url: string
        pageTitle: string
        domain: string
        detectedAt: Date
        caseId: string
      }
    }
    const data = createArg.data

    expect(data.url).toBe(targetUrl)
    expect(data.pageTitle).toBe('Exposure Post Title')
    expect(data.domain).toBe('example.com')
    expect(data.caseId).toBe(caseId)

    // detectedAt must be a Date stamped at server request time (not supplied by client)
    expect(data.detectedAt).toBeInstanceOf(Date)
    const ts = data.detectedAt.getTime()
    expect(ts).toBeGreaterThanOrEqual(before)
    expect(ts).toBeLessThanOrEqual(after)
  })

  it('derives domain from the URL hostname, not from page content', async () => {
    const targetUrl = 'https://sub.harmful-site.kr/path/to/page'
    const caseId = 'case-xyz-999'
    const fakeHtml = '<html><head><title>Some Page</title></head></html>'

    mockFetch.mockResolvedValueOnce(
      new Response(fakeHtml, {
        status: 200,
        headers: { 'content-type': 'text/html' },
      }),
    )

    mockedCreate.mockResolvedValueOnce({
      id: 'ev-2',
      url: targetUrl,
      pageTitle: 'Some Page',
      domain: 'sub.harmful-site.kr',
      detectedAt: new Date(),
      caseId,
    })

    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      body: JSON.stringify({ url: targetUrl, caseId }),
      headers: { 'content-type': 'application/json' },
    })

    await POST(req)

    const createArg = mockedCreate.mock.calls[0]![0] as {
      data: { domain: string }
    }
    expect(createArg.data.domain).toBe('sub.harmful-site.kr')
  })
})
