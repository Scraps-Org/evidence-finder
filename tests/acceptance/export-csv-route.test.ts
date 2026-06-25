import { describe, it, expect } from 'vitest'
import { GET } from '../../src/app/api/cases/[caseId]/export/route'

const EVIDENCE_ROWS = [
  {
    id: 'r1',
    url: 'https://example.com/evidence1',
    detectedAt: new Date('2024-03-01T08:00:00Z'),
    pageTitle: 'Evidence Page One',
    domain: 'example.com',
  },
  {
    id: 'r2',
    url: 'https://other.net/evidence2',
    detectedAt: new Date('2024-03-02T09:15:00Z'),
    pageTitle: 'Evidence Page Two',
    domain: 'other.net',
  },
]

vi.mock('../../src/lib/prisma', () => ({
  default: {
    evidence: {
      findMany: vi.fn().mockResolvedValue(EVIDENCE_ROWS),
    },
  },
}))

describe('D5-export-csv: API route — GET /api/cases/[caseId]/export', () => {
  it('returns a CSV file download (Content-Disposition: attachment), not inline or redirect', async () => {
    const req = new Request('http://localhost/api/cases/case-abc/export', { method: 'GET' })
    const res = await GET(req, { params: { caseId: 'case-abc' } })

    expect(res.status).toBe(200)
    const disposition = res.headers.get('content-disposition') ?? ''
    expect(disposition.toLowerCase()).toContain('attachment')
    expect(disposition.toLowerCase()).toContain('.csv')
  })

  it('CSV body contains url, detectedAt, pageTitle, domain columns for every evidence row', async () => {
    const req = new Request('http://localhost/api/cases/case-abc/export', { method: 'GET' })
    const res = await GET(req, { params: { caseId: 'case-abc' } })

    const csvText = await res.text()
    const lines = csvText.trim().split('\n')

    const header = lines[0]!
    expect(header).toMatch(/url/i)
    expect(header).toMatch(/detectedAt/i)
    expect(header).toMatch(/pageTitle/i)
    expect(header).toMatch(/domain/i)

    expect(lines.length).toBeGreaterThanOrEqual(3)

    for (const row of EVIDENCE_ROWS) {
      const matchingLine = lines.slice(1).find((line) => line.includes(row.url))
      expect(matchingLine, `row for ${row.url} not found in CSV`).toBeDefined()
      expect(matchingLine).toContain(row.detectedAt.toISOString())
      expect(matchingLine).toContain(row.pageTitle)
      expect(matchingLine).toContain(row.domain)
    }
  })
})
