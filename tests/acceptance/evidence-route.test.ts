import { POST } from '../../src/app/api/evidence/route'

// ---------------------------------------------------------------------------
// Minimal fetch stub — simulates a real HTML page with a <title> tag.
// We only stub fetch; the route handler, domain extraction, DB write, and
// timestamp are all REAL.
// ---------------------------------------------------------------------------
const FAKE_HTML = `<!DOCTYPE html><html><head><title>Example Domain</title></head><body></body></html>`

const stubFetch = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>()

vi.stubGlobal('fetch', stubFetch)

beforeEach(() => {
  stubFetch.mockResolvedValue(
    new Response(FAKE_HTML, {
      status: 200,
      headers: { 'content-type': 'text/html' },
    }),
  )
})

afterEach(() => {
  stubFetch.mockReset()
})

describe('POST /api/evidence — route handler', () => {
  it('fetches the target URL, parses <title> + domain, stamps detectedAt, and persists an Evidence row', async () => {
    const unique = `routetest-${Date.now()}`
    const targetUrl = `https://example.com/page/${unique}`

    // We need a real caseId — create one via the cases route or prisma directly.
    // Import prisma directly so this test is self-contained.
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    const caseRow = await prisma.case.create({
      data: { title: `Route test case ${unique}` },
    })

    let evidenceId: string | number | undefined
    try {
      const before = new Date()

      const req = new Request('http://localhost/api/evidence', {
        method: 'POST',
        body: JSON.stringify({ url: targetUrl, caseId: caseRow.id }),
        headers: { 'content-type': 'application/json' },
      })

      const res = await POST(req)
      const after = new Date()

      // (a) fetch was called server-side with the target URL
      expect(stubFetch).toHaveBeenCalledTimes(1)
      const fetchedUrl = String(stubFetch.mock.calls[0]![0])
      expect(fetchedUrl).toBe(targetUrl)

      // Route must respond with success
      expect(res.status).toBeGreaterThanOrEqual(200)
      expect(res.status).toBeLessThan(300)

      const body = await res.json() as { id: unknown; url: unknown; pageTitle: unknown; domain: unknown; detectedAt: unknown; caseId: unknown }

      // (b) pageTitle parsed from <title>
      expect(body.pageTitle).toBe('Example Domain')

      // (c) domain derived from hostname
      expect(body.domain).toBe('example.com')

      // (d) detectedAt stamped server-side (within test window)
      const detectedAt = new Date(body.detectedAt as string)
      expect(detectedAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(detectedAt.getTime()).toBeLessThanOrEqual(after.getTime())

      // (e) row persisted — verify it exists in the DB
      evidenceId = body.id as string | number
      const persisted = await prisma.evidence.findFirst({
        where: { id: evidenceId as never },
      })
      expect(persisted).not.toBeNull()
      expect(persisted!.url).toBe(targetUrl)
      expect(persisted!.caseId).toBe(caseRow.id)
    } finally {
      if (evidenceId !== undefined) {
        await prisma.evidence.deleteMany({ where: { id: evidenceId as never } }).catch(() => undefined)
      }
      await prisma.case.delete({ where: { id: caseRow.id } }).catch(() => undefined)
      await prisma.$disconnect()
    }
  })
})
