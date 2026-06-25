import { describe, it, expect } from 'vitest'
import { GET } from '../../src/app/api/cases/[caseId]/export/route'

describe('D5-export-csv – API route layer', () => {
  it('returns a CSV where every evidence row contains url, detectedAt, pageTitle, domain columns', async () => {
    const fakeEvidence = [
      {
        id: 'ev-1',
        url: 'https://example.com/page1',
        detectedAt: new Date('2024-01-15T10:00:00.000Z'),
        pageTitle: 'Example Page One',
        domain: 'example.com',
      },
      {
        id: 'ev-2',
        url: 'https://other.org/page2',
        detectedAt: new Date('2024-02-20T12:30:00.000Z'),
        pageTitle: 'Other Page Two',
        domain: 'other.org',
      },
    ]

    // Mock prisma so the route can be imported directly without a real DB
    vi.mock('../../src/lib/prisma', () => ({
      default: {
        evidence: {
          findMany: vi.fn().mockResolvedValue(fakeEvidence),
        },
        case: {
          findUnique: vi.fn().mockResolvedValue({ id: 'case-1', name: 'Test Case' }),
        },
      },
    }))

    const req = new Request('http://localhost/api/cases/case-1/export', { method: 'GET' })
    const params = Promise.resolve({ caseId: 'case-1' })
    const res = await GET(req, { params })

    expect(res.status).toBe(200)

    const contentType = res.headers.get('content-type') ?? ''
    expect(contentType).toMatch(/text\/csv/i)

    const body = await res.text()
    const lines = body.trim().split('\n').filter(Boolean)

    // At least a header row + 2 data rows
    expect(lines.length).toBeGreaterThanOrEqual(3)

    const header = lines[0]!.toLowerCase()
    expect(header).toContain('url')
    expect(header).toContain('detectedat')
    expect(header).toContain('pagetitle')
    expect(header).toContain('domain')

    // Verify each data row contains the expected values
    const dataRows = lines.slice(1)
    for (const row of dataRows) {
      // Each row must be non-empty and contain comma-separated values
      expect(row.trim()).toBeTruthy()
      const cols = row.split(',')
      // url, detectedAt, pageTitle, domain = at least 4 columns
      expect(cols.length).toBeGreaterThanOrEqual(4)
    }

    // Spot-check actual values appear in the CSV body
    expect(body).toContain('example.com/page1')
    expect(body).toContain('Example Page One')
    expect(body).toContain('2024-01-15')
    expect(body).toContain('other.org')
  })
})
