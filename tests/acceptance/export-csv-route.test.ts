import { describe, it, expect } from 'vitest'
import { GET } from '../../src/app/api/cases/[id]/export/route'

describe('D5-export-csv: route – CSV contains required columns per evidence row', () => {
  it('returns a CSV where every evidence row has url, detectedAt, pageTitle, domain columns', async () => {
    const req = new Request('http://localhost/api/cases/case-test-1/export', {
      method: 'GET',
    })
    const params = Promise.resolve({ id: 'case-test-1' })

    const res = await GET(req, { params })

    expect(res.status).toBe(200)

    const contentDisposition = res.headers.get('content-disposition') ?? ''
    expect(contentDisposition).toMatch(/attachment/i)

    const text = await res.text()
    const lines = text.trim().split('\n').filter(Boolean)

    expect(lines.length).toBeGreaterThanOrEqual(1)

    const headerLine = lines[0]!
    const headers = headerLine.split(',')
    expect(headers).toContain('url')
    expect(headers).toContain('detectedAt')
    expect(headers).toContain('pageTitle')
    expect(headers).toContain('domain')
  })

  it('returns Content-Type text/csv', async () => {
    const req = new Request('http://localhost/api/cases/case-test-2/export', {
      method: 'GET',
    })
    const params = Promise.resolve({ id: 'case-test-2' })

    const res = await GET(req, { params })

    const contentType = res.headers.get('content-type') ?? ''
    expect(contentType).toMatch(/text\/csv/i)
  })
})
