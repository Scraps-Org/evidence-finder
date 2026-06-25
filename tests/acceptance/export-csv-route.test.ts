import { describe, it, expect } from 'vitest'
import { GET } from '../../src/app/api/cases/[caseId]/export/route'

describe('D5-export-csv route', () => {
  const _evidence = [
    {
      id: 'ev-1',
      url: 'https://example.com/page1',
      detectedAt: new Date('2024-01-15T10:00:00Z'),
      pageTitle: 'Example Page One',
      domain: 'example.com',
      caseId: 'case-abc',
    },
    {
      id: 'ev-2',
      url: 'https://other.org/page2',
      detectedAt: new Date('2024-01-16T12:00:00Z'),
      pageTitle: 'Other Page Two',
      domain: 'other.org',
      caseId: 'case-abc',
    },
  ]

  it('returns a CSV file download response (not inline) with all required columns', async () => {
    // Mock prisma at module level via vi.mock is not available here;
    // instead call the handler with a real-ish Request and assert shape.
    // The route must accept GET /api/cases/[caseId]/export and return CSV.
    const req = new Request('http://localhost/api/cases/case-abc/export', {
      method: 'GET',
    })
    const params = { caseId: 'case-abc' }

    // Call the route handler directly
    const res = await GET(req, { params })

    // Must respond with 200
    expect(res.status).toBe(200)

    // Content-Type must indicate CSV
    const contentType = res.headers.get('content-type') ?? ''
    expect(contentType).toMatch(/text\/csv/i)

    // Content-Disposition must trigger download (attachment), not inline
    const disposition = res.headers.get('content-disposition') ?? ''
    expect(disposition).toMatch(/attachment/i)
    expect(disposition).toMatch(/\.csv/i)

    // Body must be valid CSV with the four required columns in the header
    const body = await res.text()
    const headerLine = body.split('\n')[0] ?? ''
    expect(headerLine).toMatch(/url/i)
    expect(headerLine).toMatch(/detectedAt/i)
    expect(headerLine).toMatch(/pageTitle/i)
    expect(headerLine).toMatch(/domain/i)
  })
})
