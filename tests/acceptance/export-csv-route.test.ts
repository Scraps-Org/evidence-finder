import { describe, it, expect } from 'vitest'
import { GET } from '../../src/app/api/cases/[caseId]/export/route'

const EVIDENCE_ROWS = [
  {
    url: 'https://alpha.com/one',
    detectedAt: new Date('2026-05-01T08:00:00Z'),
    pageTitle: 'Alpha One',
    domain: 'alpha.com',
  },
  {
    url: 'https://beta.io/two',
    detectedAt: new Date('2026-05-02T09:00:00Z'),
    pageTitle: 'Beta Two',
    domain: 'beta.io',
  },
]

vi.mock('../../src/lib/prisma', () => ({
  default: {
    evidence: {
      findMany: vi.fn().mockResolvedValue(EVIDENCE_ROWS),
    },
  },
}))

describe('D5-export-csv route: GET /api/cases/[caseId]/export', () => {
  it('returns a CSV with url, detectedAt, pageTitle, domain columns for every evidence row', async () => {
    const req = new Request('http://localhost/api/cases/case-abc/export', { method: 'GET' })
    const res = await GET(req, { params: { caseId: 'case-abc' } })

    expect(res.status).toBe(200)

    const contentDisposition = res.headers.get('content-disposition') ?? ''
    const contentType = res.headers.get('content-type') ?? ''
    const isAttachment = /attachment/i.test(contentDisposition)
    const isCsv = /text\/csv|application\/octet-stream/i.test(contentType)
    expect(isAttachment || isCsv).toBe(true)

    const body = await res.text()
    const lines = body.trim().split('\n').map((l) => l.trim())

    const header = lines[0]!
    const cols = header.split(',')
    expect(cols).toContain('url')
    expect(cols).toContain('detectedAt')
    expect(cols).toContain('pageTitle')
    expect(cols).toContain('domain')

    expect(lines.length).toBe(EVIDENCE_ROWS.length + 1)

    const urlIdx = cols.indexOf('url')
    const detectedAtIdx = cols.indexOf('detectedAt')
    const pageTitleIdx = cols.indexOf('pageTitle')
    const domainIdx = cols.indexOf('domain')

    for (let i = 0; i < EVIDENCE_ROWS.length; i++) {
      const row = lines[i + 1]!
      const cells = row.split(',')
      expect(cells[urlIdx]).toBeTruthy()
      expect(cells[detectedAtIdx]).toBeTruthy()
      expect(cells[pageTitleIdx]).toBeTruthy()
      expect(cells[domainIdx]).toBeTruthy()
    }
  })
})
