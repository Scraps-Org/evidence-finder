import { describe, it, expect } from 'vitest'
import { GET } from '../../src/app/api/cases/[id]/export/route'

const REQUIRED_COLUMNS = ['url', 'detectedAt', 'pageTitle', 'domain'] as const

describe('D5-export-csv: exported CSV contains required columns per evidence row', () => {
  it('returns a CSV response with url, detectedAt, pageTitle, domain columns for every evidence row', async () => {
    const mockEvidence = [
      {
        id: 'e1',
        url: 'https://example.com/a',
        detectedAt: new Date('2026-06-01T09:00:00.000Z'),
        pageTitle: 'Alpha Page',
        domain: 'example.com',
      },
      {
        id: 'e2',
        url: 'https://beta.io/b',
        detectedAt: new Date('2026-06-02T12:00:00.000Z'),
        pageTitle: 'Beta Page',
        domain: 'beta.io',
      },
    ]

    // Call the route handler directly, injecting a mock DB via the request context
    const req = new Request('http://localhost/api/cases/case-42/export', {
      method: 'GET',
    })

    const res = await GET(req, { params: { id: 'case-42' } }, mockEvidence)

    // If the route does not accept injected evidence, try the standard 2-arg form
    // The coder must wire GET to accept a third optional arg or use the mock DB.
    // The acceptance: status 200, content-type text/csv, all columns present.
    expect(res.status).toBe(200)

    const contentType = res.headers.get('content-type') ?? ''
    expect(contentType).toMatch(/text\/csv/i)

    const body = await res.text()
    const lines = body.trim().split('\n').filter((l) => l.trim() !== '')

    // First line is header
    expect(lines.length).toBeGreaterThanOrEqual(1)
    const header = lines[0]!.toLowerCase()
    for (const col of REQUIRED_COLUMNS) {
      expect(header).toContain(col.toLowerCase())
    }

    // Each data row must have all 4 values (non-empty fields)
    const headerCols = lines[0]!.split(',').map((c) => c.trim().toLowerCase())
    const urlIdx = headerCols.indexOf('url')
    const detectedAtIdx = headerCols.indexOf('detectedat')
    const pageTitleIdx = headerCols.indexOf('pagetitle')
    const domainIdx = headerCols.indexOf('domain')

    expect(urlIdx).toBeGreaterThanOrEqual(0)
    expect(detectedAtIdx).toBeGreaterThanOrEqual(0)
    expect(pageTitleIdx).toBeGreaterThanOrEqual(0)
    expect(domainIdx).toBeGreaterThanOrEqual(0)

    const dataLines = lines.slice(1)
    expect(dataLines.length).toBe(mockEvidence.length)

    for (const line of dataLines) {
      const cols = line.split(',')
      expect(cols[urlIdx]!.trim()).not.toBe('')
      expect(cols[detectedAtIdx]!.trim()).not.toBe('')
      expect(cols[pageTitleIdx]!.trim()).not.toBe('')
      expect(cols[domainIdx]!.trim()).not.toBe('')
    }
  })

  it('response triggers a file download via Content-Disposition attachment header', async () => {
    const req = new Request('http://localhost/api/cases/case-99/export', {
      method: 'GET',
    })

    const res = await GET(req, { params: { id: 'case-99' } })

    const disposition = res.headers.get('content-disposition') ?? ''
    expect(disposition).toMatch(/attachment/i)
    expect(disposition).toMatch(/\.csv/i)
  })
})
