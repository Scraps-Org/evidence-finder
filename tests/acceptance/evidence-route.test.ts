import { POST } from '../../src/app/api/evidence/route'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const FAKE_TITLE = 'Fake Page Title'
const FAKE_HTML = `<html><head><title>${FAKE_TITLE}</title></head><body>hello</body></html>`

let caseId: string
const tag = `route-${Date.now()}`

beforeAll(async () => {
  const c = await prisma.case.create({ data: { title: `RouteCase ${tag}` } })
  caseId = c.id
})

afterEach(async () => {
  await prisma.evidence.deleteMany({ where: { caseId } })
})

afterAll(async () => {
  await prisma.case.delete({ where: { id: caseId } })
  await prisma.$disconnect()
})

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
      new Response(FAKE_HTML, {
        status: 200,
        headers: { 'content-type': 'text/html' },
      }),
    ),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('POST /api/evidence — server route', () => {
  it('fetches the target URL server-side', async () => {
    const targetUrl = `https://example.com/page-${tag}`
    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      body: JSON.stringify({ url: targetUrl, caseId }),
      headers: { 'content-type': 'application/json' },
    })

    await POST(req)

    const globalFetch = vi.mocked(fetch)
    expect(globalFetch).toHaveBeenCalledOnce()
    expect(globalFetch.mock.calls[0]![0]).toBe(targetUrl)
  })

  it('parses <title> into pageTitle and derives domain from URL hostname', async () => {
    const targetUrl = `https://example.com/page-${tag}`
    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      body: JSON.stringify({ url: targetUrl, caseId }),
      headers: { 'content-type': 'application/json' },
    })

    const res = await POST(req)
    expect(res.status).toBe(201)

    const body = await res.json() as { pageTitle: string; domain: string; detectedAt: string; url: string; caseId: string }
    expect(body.pageTitle).toBe(FAKE_TITLE)
    expect(body.domain).toBe('example.com')
  })

  it('stamps detectedAt with a server-side timestamp close to now', async () => {
    const before = Date.now()
    const targetUrl = `https://example.com/ts-${tag}`
    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      body: JSON.stringify({ url: targetUrl, caseId }),
      headers: { 'content-type': 'application/json' },
    })

    const res = await POST(req)
    const after = Date.now()

    const body = await res.json() as { detectedAt: string }
    const detected = new Date(body.detectedAt).getTime()
    expect(detected).toBeGreaterThanOrEqual(before)
    expect(detected).toBeLessThanOrEqual(after)
  })

  it('persists the Evidence row in the database via Prisma', async () => {
    const targetUrl = `https://example.com/persist-${tag}`
    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      body: JSON.stringify({ url: targetUrl, caseId }),
      headers: { 'content-type': 'application/json' },
    })

    await POST(req)

    const row = await prisma.evidence.findFirst({ where: { url: targetUrl, caseId } })
    expect(row).not.toBeNull()
    expect(row!.pageTitle).toBe(FAKE_TITLE)
    expect(row!.domain).toBe('example.com')
  })
})
