import { describe, it, expect } from 'vitest'
import { GET } from '../../src/app/api/export-csv/route'

describe('D5-export-csv – API route: CSV contains required columns per evidence row', () => {
  it('returns a CSV with url, detectedAt, pageTitle, domain columns for every evidence row', async () => {
    const request = new Request('http://localhost/api/export-csv?caseId=case-1', {
      method: 'GET',
    })

    const response = await GET(request)

    expect(response.status).toBe(200)

    const contentType = response.headers.get('content-type') ?? ''
    expect(contentType).toMatch(/text\/csv/i)

    const contentDisposition = response.headers.get('content-disposition') ?? ''
    // Must be an attachment download, not inline
    expect(contentDisposition).toMatch(/attachment/i)

    const body = await response.text()
    const lines = body.trim().split('\n').filter((l) => l.trim().length > 0)

    // Must have at least a header row
    expect(lines.length).toBeGreaterThanOrEqual(1)

    const headerLine = lines[0]!
    const headers = headerLine.split(',').map((h) => h.trim().replace(/^"|"$/g, ''))

    expect(headers).toContain('url')
    expect(headers).toContain('detectedAt')
    expect(headers).toContain('pageTitle')
    expect(headers).toContain('domain')

    // If there are data rows, every row must have values in all 4 positions
    const urlIdx = headers.indexOf('url')
    const detectedAtIdx = headers.indexOf('detectedAt')
    const pageTitleIdx = headers.indexOf('pageTitle')
    const domainIdx = headers.indexOf('domain')

    const dataLines = lines.slice(1)
    for (const line of dataLines) {
      const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
      expect(cols[urlIdx]).toBeDefined()
      expect(cols[detectedAtIdx]).toBeDefined()
      expect(cols[pageTitleIdx]).toBeDefined()
      expect(cols[domainIdx]).toBeDefined()
    }
  })

  it('response is an attachment download, not inline or redirect', async () => {
    const request = new Request('http://localhost/api/export-csv?caseId=case-1', {
      method: 'GET',
    })

    const response = await GET(request)

    expect(response.status).not.toBe(301)
    expect(response.status).not.toBe(302)
    expect(response.status).not.toBe(303)

    const contentDisposition = response.headers.get('content-disposition') ?? ''
    expect(contentDisposition.toLowerCase()).toContain('attachment')
    expect(contentDisposition.toLowerCase()).not.toContain('inline')
  })
})
