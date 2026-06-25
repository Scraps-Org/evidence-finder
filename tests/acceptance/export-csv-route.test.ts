import { describe, it, expect } from 'vitest'
import { GET } from '../../src/app/api/cases/[caseId]/export/route'

const REQUIRED_COLUMNS = ['url', 'detectedAt', 'pageTitle', 'domain'] as const

describe('D5-export-csv: API route returns CSV with required columns', () => {
  it('responds with content-type text/csv', async () => {
    const req = new Request('http://localhost/api/cases/case-1/export', {
      method: 'GET',
    })
    const res = await GET(req, { params: { caseId: 'case-1' } })
    expect(res.headers.get('content-type')).toMatch(/text\/csv/)
  })

  it('CSV header row contains all four required columns: url, detectedAt, pageTitle, domain', async () => {
    const req = new Request('http://localhost/api/cases/case-1/export', {
      method: 'GET',
    })
    const res = await GET(req, { params: { caseId: 'case-1' } })
    const text = await res.text()
    const headerLine = text.split('\n')[0] ?? ''
    const headers = headerLine.split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
    for (const col of REQUIRED_COLUMNS) {
      expect(headers, `CSV header must include column "${col}"`).toContain(col)
    }
  })

  it('each data row has exactly the four required columns populated', async () => {
    const evidence = [
      {
        id: 'ev-1',
        url: 'https://example.com',
        detectedAt: new Date('2024-01-15T10:00:00Z'),
        pageTitle: 'Example',
        domain: 'example.com',
        caseId: 'case-1',
        createdAt: new Date(),
      },
    ]

    const req = new Request('http://localhost/api/cases/case-1/export', {
      method: 'GET',
    })

    const { prisma } = await import('../../src/lib/prisma')
    const { vi } = await import('vitest')
    vi.spyOn(prisma.evidence, 'findMany').mockResolvedValueOnce(evidence)

    const res = await GET(req, { params: { caseId: 'case-1' } })
    const text = await res.text()
    const lines = text.split('\n').filter((l) => l.trim() !== '')
    expect(lines.length).toBeGreaterThanOrEqual(2)

    const headerLine = lines[0] ?? ''
    const headers = headerLine.split(',').map((h) => h.trim().replace(/^"|"$/g, ''))

    for (const dataLine of lines.slice(1)) {
      const values = dataLine.split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
      for (const col of REQUIRED_COLUMNS) {
        const idx = headers.indexOf(col)
        expect(idx, `Column "${col}" not found in header`).toBeGreaterThanOrEqual(0)
        expect(
          values[idx],
          `Row value for column "${col}" must not be empty`
        ).toBeTruthy()
      }
    }
  })
})
