import { POST } from '../../src/app/api/evidence/route'

const FAKE_CASE_ID = 'test-case-id-001'
const FAKE_URL = 'https://www.example.com/some-page'
const FAKE_HTML = '<html><head><title>Example Domain Title</title></head><body>content</body></html>'

beforeEach(() => {
  vi.clearAllMocks()
})

vi.mock('../../src/lib/prisma', () => ({
  default: {
    evidence: {
      create: vi.fn(),
    },
  },
}))

describe('POST /api/evidence – server route', () => {
  it('fetches the target URL, parses title and domain, stamps detectedAt, and persists via Prisma', async () => {
    const { default: prisma } = await import('../../src/lib/prisma')
    const mockCreate = vi.mocked(prisma.evidence.create)

    const createdRow = {
      id: 'ev-001',
      url: FAKE_URL,
      pageTitle: 'Example Domain Title',
      domain: 'www.example.com',
      detectedAt: new Date(),
      caseId: FAKE_CASE_ID,
    }
    mockCreate.mockResolvedValue(createdRow)

    const fetchSpy = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
      new Response(FAKE_HTML, { status: 200, headers: { 'content-type': 'text/html' } })
    )
    vi.stubGlobal('fetch', fetchSpy)

    const before = new Date()
    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      body: JSON.stringify({ url: FAKE_URL, caseId: FAKE_CASE_ID }),
      headers: { 'content-type': 'application/json' },
    })

    const res = await POST(req)
    const after = new Date()

    // (a) fetched the target page server-side
    expect(fetchSpy).toHaveBeenCalledWith(FAKE_URL)

    // (b) pageTitle extracted from <title>
    expect(mockCreate).toHaveBeenCalledTimes(1)
    const callArg = mockCreate.mock.calls[0]![0]
    expect(callArg.data.pageTitle).toBe('Example Domain Title')

    // (c) domain derived from URL hostname
    expect(callArg.data.domain).toBe('www.example.com')

    // (d) detectedAt is a server-side timestamp within the request window
    expect(callArg.data.detectedAt).toBeInstanceOf(Date)
    expect((callArg.data.detectedAt as Date).getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect((callArg.data.detectedAt as Date).getTime()).toBeLessThanOrEqual(after.getTime())

    // (e) persisted with correct url and caseId
    expect(callArg.data.url).toBe(FAKE_URL)
    expect(callArg.data.caseId).toBe(FAKE_CASE_ID)

    // route returns 201 with the created evidence
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBe('ev-001')
  })

  it('returns 400 when url or caseId is missing', async () => {
    vi.stubGlobal('fetch', vi.fn())

    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      body: JSON.stringify({ url: FAKE_URL }),
      headers: { 'content-type': 'application/json' },
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
