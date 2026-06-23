import { POST } from '../../src/app/api/evidence/route'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

beforeEach(() => {
  vi.clearAllMocks()
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('POST /api/evidence', () => {
  it('fetches the target page, extracts title and domain, stamps detectedAt, and persists an Evidence row', async () => {
    const timestamp = Date.now()

    const kase = await prisma.case.create({
      data: { title: `Test Case ${timestamp}` },
    })

    const fakeHtml = `<html><head><title>My Fetched Page ${timestamp}</title></head><body>hello</body></html>`

    const mockFetch = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
      new Response(fakeHtml, {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      }),
    )
    vi.stubGlobal('fetch', mockFetch)

    const targetUrl = `https://evidence-target-${timestamp}.example.com/some/path`

    const before = new Date()
    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      body: JSON.stringify({ url: targetUrl, caseId: kase.id }),
      headers: { 'content-type': 'application/json' },
    })

    const res = await POST(req)
    const after = new Date()

    expect(res.status).toBe(201)

    const body = await res.json() as { id: string; url: string; pageTitle: string; domain: string; detectedAt: string; caseId: string }

    // (a) fetched the target page server-side
    expect(mockFetch).toHaveBeenCalledWith(targetUrl, expect.anything())

    // (b) parsed <title> into pageTitle
    expect(body.pageTitle).toBe(`My Fetched Page ${timestamp}`)

    // (c) derived domain from hostname
    expect(body.domain).toBe(`evidence-target-${timestamp}.example.com`)

    // (d) stamped detectedAt
    const detectedAt = new Date(body.detectedAt)
    expect(detectedAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(detectedAt.getTime()).toBeLessThanOrEqual(after.getTime())

    // (e) persisted a new Evidence row
    const row = await prisma.evidence.findUnique({ where: { id: body.id } })
    expect(row).not.toBeNull()
    expect(row!.url).toBe(targetUrl)
    expect(row!.caseId).toBe(kase.id)

    await prisma.evidence.delete({ where: { id: body.id } })
    await prisma.case.delete({ where: { id: kase.id } })
  })
})
