import { describe, it, expect } from 'vitest'
import { GET } from '../../src/app/api/cases/[id]/export/route'

describe('D5-export-csv – API route: CSV contains required columns per evidence row', () => {
  it('returns a CSV where every evidence row has url, detectedAt, pageTitle, domain columns', async () => {
    const evidenceItems = [
      {
        id: 'ev-1',
        url: 'https://example.com/page',
        detectedAt: new Date('2026-01-15T10:00:00.000Z'),
        pageTitle: 'Example Page Title',
        domain: 'example.com',
        caseId: 'case-abc',
      },
      {
        id: 'ev-2',
        url: 'https://other.org/article',
        detectedAt: new Date('2026-02-20T12:30:00.000Z'),
        pageTitle: 'Other Article',
        domain: 'other.org',
        caseId: 'case-abc',
      },
    ]

    const req = new Request('http://localhost/api/cases/case-abc/export', {
      method: 'GET',
    })

    const res = await GET(req, { params: { id: 'case-abc' } }, evidenceItems)

    expect(res.status).toBe(200)

    const contentDisposition = res.headers.get('content-disposition') ?? ''
    expect(contentDisposition).toMatch(/attachment/i)
    expect(contentDisposition).toMatch(/\.csv/i)

    const contentType = res.headers.get('content-type') ?? ''
    expect(contentType).toMatch(/text\/csv/i)

    const text = await res.text()
    const lines = text.trim().split('\n')

    const headerLine = lines[0]!
    const headers = headerLine.split(',')
    expect(headers).toContain('url')
    expect(headers).toContain('detectedAt')
    expect(headers).toContain('pageTitle')
    expect(headers).toContain('domain')

    expect(lines.length).toBeGreaterThanOrEqual(3)

    const urlIdx = headers.indexOf('url')
    const detectedAtIdx = headers.indexOf('detectedAt')
    const pageTitleIdx = headers.indexOf('pageTitle')
    const domainIdx = headers.indexOf('domain')

    const dataLines = lines.slice(1)
    for (const line of dataLines) {
      const cols = line.split(',')
      expect(cols[urlIdx]).toBeTruthy()
      expect(cols[detectedAtIdx]).toBeTruthy()
      expect(cols[pageTitleIdx]).toBeTruthy()
      expect(cols[domainIdx]).toBeTruthy()
    }
  })
})
