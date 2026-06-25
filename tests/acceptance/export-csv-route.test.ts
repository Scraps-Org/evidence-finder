import { describe, it, expect } from 'vitest'
import { GET } from '../../src/app/api/cases/[caseId]/export/route'

const EVIDENCE_ROWS = [
  {
    url: 'https://example.com/page1',
    detectedAt: new Date('2026-06-01T10:00:00.000Z'),
    pageTitle: 'Example Page One',
    domain: 'example.com',
  },
  {
    url: 'https://other.org/page2',
    detectedAt: new Date('2026-06-02T12:00:00.000Z'),
    pageTitle: 'Other Page Two',
    domain: 'other.org',
  },
]

vi.mock('../../src/lib/prisma', () => ({
  default: {
    evidence: {
      findMany: vi.fn(() => Promise.resolve(EVIDENCE_ROWS)),
    },
  },
}))

describe('D5-export-csv route', () => {
  it('returns a CSV response with url, detectedAt, pageTitle, domain columns for every evidence row', async () => {
    const req = new Request('http://localhost/api/cases/case-abc/export', { method: 'GET' })
    const res = await GET(req, { params: { caseId: 'case-abc' } })

    expect(res.status).toBe(200)

    const contentType = res.headers.get('content-type') ?? ''
    expect(contentType).toMatch(/text\/csv/i)

    const text = await res.text()
    const lines = text.trim().split('\n').filter(Boolean)

    // Header row must contain all four required columns
    const header = lines[0]!
    expect(header).toMatch(/url/i)
    expect(header).toMatch(/detectedAt/i)
    expect(header).toMatch(/pageTitle/i)
    expect(header).toMatch(/domain/i)

    // Every evidence row must be present
    expect(lines.length).toBe(EVIDENCE_ROWS.length + 1)

    for (let i = 0; i < EVIDENCE_ROWS.length; i++) {
      const row = lines[i + 1]!
      const evidence = EVIDENCE_ROWS[i]!
      expect(row).toContain(evidence.url)
      expect(row).toContain(evidence.domain)
      expect(row).toContain(evidence.pageTitle)
    }
  })
})
