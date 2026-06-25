import { describe, it, expect } from 'vitest'
import { GET } from '../../src/app/api/cases/[caseId]/export/route'

const CASE_ID = 'test-case-export-001'

const EVIDENCE_ROWS = [
  {
    id: 'row-1',
    url: 'https://alpha.test/foo',
    detectedAt: new Date('2026-05-10T08:00:00.000Z'),
    pageTitle: 'Alpha Foo Page',
    domain: 'alpha.test',
    caseId: CASE_ID,
  },
  {
    id: 'row-2',
    url: 'https://beta.test/bar',
    detectedAt: new Date('2026-05-11T09:00:00.000Z'),
    pageTitle: 'Beta Bar Page',
    domain: 'beta.test',
    caseId: CASE_ID,
  },
]

vi.mock('../../src/lib/prisma', () => ({
  default: {
    evidence: {
      findMany: vi.fn().mockResolvedValue(EVIDENCE_ROWS),
    },
  },
}))

describe('D5-export-csv: route returns CSV with all required columns', () => {
  it('responds with a CSV containing url, detectedAt, pageTitle, domain for every evidence row', async () => {
    const req = new Request(`http://localhost/api/cases/${CASE_ID}/export`, { method: 'GET' })
    const res = await GET(req, { params: { caseId: CASE_ID } })

    expect(res.status).toBe(200)

    const contentType = res.headers.get('content-type') ?? ''
    expect(contentType).toMatch(/text\/csv/i)

    const contentDisposition = res.headers.get('content-disposition') ?? ''
    expect(contentDisposition).toMatch(/attachment/i)
    expect(contentDisposition).toMatch(/\.csv/i)

    const text = await res.text()
    const lines = text.trim().split('\n').map((l) => l.trim())

    const header = lines[0]!
    const headerCols = header.split(',').map((c) => c.replace(/"/g, '').trim())
    expect(headerCols).toContain('url')
    expect(headerCols).toContain('detectedAt')
    expect(headerCols).toContain('pageTitle')
    expect(headerCols).toContain('domain')

    expect(lines.length).toBe(EVIDENCE_ROWS.length + 1)

    const urlIdx = headerCols.indexOf('url')
    const detectedAtIdx = headerCols.indexOf('detectedAt')
    const pageTitleIdx = headerCols.indexOf('pageTitle')
    const domainIdx = headerCols.indexOf('domain')

    for (let i = 0; i < EVIDENCE_ROWS.length; i++) {
      const row = EVIDENCE_ROWS[i]!
      const dataLine = lines[i + 1]!
      const cols = dataLine.split(',').map((c) => c.replace(/"/g, '').trim())

      expect(cols[urlIdx]).toBe(row.url)
      expect(cols[detectedAtIdx]).toBeTruthy()
      expect(cols[pageTitleIdx]).toBe(row.pageTitle)
      expect(cols[domainIdx]).toBe(row.domain)
    }
  })
})
