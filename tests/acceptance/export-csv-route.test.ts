import { describe, it, expect } from 'vitest'
import { GET } from '../../src/app/api/cases/[id]/export/route'

const EVIDENCE_ROWS = [
  {
    id: 'e1',
    url: 'https://example.com/page1',
    detectedAt: new Date('2026-06-25T10:00:00.000Z'),
    pageTitle: 'Example Page One',
    domain: 'example.com',
    caseId: 'case-abc',
    createdAt: new Date('2026-06-25T10:00:00.000Z'),
  },
  {
    id: 'e2',
    url: 'https://other.org/page2',
    detectedAt: new Date('2026-06-24T09:00:00.000Z'),
    pageTitle: 'Other Page Two',
    domain: 'other.org',
    caseId: 'case-abc',
    createdAt: new Date('2026-06-24T09:00:00.000Z'),
  },
]

vi.mock('../../src/lib/prisma', () => ({
  default: {
    evidence: {
      findMany: vi.fn().mockResolvedValue(EVIDENCE_ROWS),
    },
  },
}))

describe('D5-export-csv: GET /api/cases/[id]/export route', () => {
  it('triggers a file download response (Content-Disposition: attachment) not inline', async () => {
    const req = new Request('http://test/api/cases/case-abc/export', { method: 'GET' })
    const res = await GET(req, { params: { id: 'case-abc' } })

    expect(res.status).toBe(200)
    const disposition = res.headers.get('Content-Disposition') ?? ''
    expect(disposition).toMatch(/attachment/i)
    expect(disposition).toMatch(/\.csv/i)
  })

  it('CSV body contains url, detectedAt, pageTitle, domain columns for every evidence row', async () => {
    const req = new Request('http://test/api/cases/case-abc/export', { method: 'GET' })
    const res = await GET(req, { params: { id: 'case-abc' } })

    const csvText = await res.text()
    const lines = csvText.trim().split('\n')
    const header = lines[0]!

    expect(header).toMatch(/url/i)
    expect(header).toMatch(/detectedAt/i)
    expect(header).toMatch(/pageTitle/i)
    expect(header).toMatch(/domain/i)

    expect(lines.length).toBe(EVIDENCE_ROWS.length + 1)

    for (let i = 0; i < EVIDENCE_ROWS.length; i++) {
      const row = lines[i + 1]!
      expect(row).toContain(EVIDENCE_ROWS[i]!.url)
      expect(row).toContain(EVIDENCE_ROWS[i]!.pageTitle)
      expect(row).toContain(EVIDENCE_ROWS[i]!.domain)
    }
  })
})
