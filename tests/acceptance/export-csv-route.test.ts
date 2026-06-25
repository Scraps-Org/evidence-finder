import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../../src/app/api/cases/[caseId]/export/route'

describe('D5-export-csv — API route layer', () => {
  beforeEach(() => {
    vi.mock('../../src/lib/prisma', () => ({
      default: {
        evidence: {
          findMany: vi.fn().mockResolvedValue([
            {
              id: 'ev-1',
              url: 'https://example.com/a',
              detectedAt: new Date('2026-06-01T10:00:00.000Z'),
              pageTitle: 'Alpha Page',
              domain: 'example.com',
            },
            {
              id: 'ev-2',
              url: 'https://example.com/b',
              detectedAt: new Date('2026-06-02T12:00:00.000Z'),
              pageTitle: 'Beta Page',
              domain: 'example.com',
            },
          ]),
        },
      },
    }))
  })

  it('responds with Content-Type text/csv and a downloadable attachment disposition', async () => {
    const req = new Request('http://localhost/api/cases/case-123/export', {
      method: 'GET',
    })
    const res = await GET(req, { params: { caseId: 'case-123' } })

    expect(res.status).toBe(200)
    const contentType = res.headers.get('content-type') ?? ''
    expect(contentType).toContain('text/csv')
    const disposition = res.headers.get('content-disposition') ?? ''
    expect(disposition).toMatch(/attachment/i)
    expect(disposition).toMatch(/\.csv/i)
  })

  it('CSV body contains url, detectedAt, pageTitle, domain for every evidence row', async () => {
    const req = new Request('http://localhost/api/cases/case-123/export', {
      method: 'GET',
    })
    const res = await GET(req, { params: { caseId: 'case-123' } })

    const csv = await res.text()
    const lines = csv.trim().split('\n')

    const header = lines[0]!.toLowerCase()
    expect(header).toContain('url')
    expect(header).toContain('detectedat')
    expect(header).toContain('pagetitle')
    expect(header).toContain('domain')

    // two evidence rows + header
    expect(lines.length).toBe(3)

    const row1 = lines[1]!
    expect(row1).toContain('https://example.com/a')
    expect(row1).toContain('Alpha Page')
    expect(row1).toContain('example.com')

    const row2 = lines[2]!
    expect(row2).toContain('https://example.com/b')
    expect(row2).toContain('Beta Page')
    expect(row2).toContain('example.com')
  })
})
