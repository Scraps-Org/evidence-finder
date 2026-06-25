import { describe, it, expect } from 'vitest'
import { GET } from '../../src/app/api/cases/[id]/export-csv/route'

const EVIDENCE_ROWS = [
  {
    url: 'https://alpha.example.com/article',
    detectedAt: new Date('2026-06-01T08:00:00.000Z'),
    pageTitle: 'Alpha Article',
    domain: 'alpha.example.com',
  },
  {
    url: 'https://beta.example.com/post',
    detectedAt: new Date('2026-06-02T09:00:00.000Z'),
    pageTitle: 'Beta Post',
    domain: 'beta.example.com',
  },
]

vi.mock('../../src/lib/prisma', () => ({
  default: {
    evidence: {
      findMany: vi.fn().mockResolvedValue(EVIDENCE_ROWS),
    },
  },
}))

describe('D5-export-csv: GET /api/cases/[id]/export-csv', () => {
  it('returns a CSV attachment with url, detectedAt, pageTitle, domain columns for every evidence row', async () => {
    const req = new Request('http://localhost/api/cases/case-abc/export-csv')
    const res = await GET(req, { params: { id: 'case-abc' } })

    expect(res.status).toBe(200)

    const contentDisposition = res.headers.get('content-disposition') ?? ''
    expect(contentDisposition).toMatch(/attachment/i)

    const contentType = res.headers.get('content-type') ?? ''
    expect(contentType).toMatch(/text\/csv/i)

    const body = await res.text()
    const lines = body.trim().split('\n').map((l) => l.trim())

    const header = lines[0]!
    const headerCols = header.split(',')
    expect(headerCols).toContain('url')
    expect(headerCols).toContain('detectedAt')
    expect(headerCols).toContain('pageTitle')
    expect(headerCols).toContain('domain')

    const dataLines = lines.slice(1)
    expect(dataLines).toHaveLength(EVIDENCE_ROWS.length)

    for (const line of dataLines) {
      const cols = line.split(',')
      const urlIdx = headerCols.indexOf('url')
      const detectedAtIdx = headerCols.indexOf('detectedAt')
      const pageTitleIdx = headerCols.indexOf('pageTitle')
      const domainIdx = headerCols.indexOf('domain')

      expect(cols[urlIdx]).toBeTruthy()
      expect(cols[detectedAtIdx]).toBeTruthy()
      expect(cols[pageTitleIdx]).toBeTruthy()
      expect(cols[domainIdx]).toBeTruthy()
    }

    const urlIdx = headerCols.indexOf('url')
    const domainIdx = headerCols.indexOf('domain')
    const row1 = dataLines[0]!.split(',')
    const row2 = dataLines[1]!.split(',')
    expect(row1[urlIdx]).toContain('alpha.example.com')
    expect(row1[domainIdx]).toContain('alpha.example.com')
    expect(row2[urlIdx]).toContain('beta.example.com')
    expect(row2[domainIdx]).toContain('beta.example.com')
  })
})
