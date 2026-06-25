import { describe, it, expect } from 'vitest'
import { GET } from '../../src/app/api/cases/[id]/export/route'

const MOCK_EVIDENCE = [
  {
    id: 'ev-1',
    url: 'https://example.com/page1',
    detectedAt: new Date('2026-06-01T10:00:00Z'),
    pageTitle: 'Example Page One',
    domain: 'example.com',
    caseId: 'case-abc',
  },
  {
    id: 'ev-2',
    url: 'https://other.org/page2',
    detectedAt: new Date('2026-06-02T12:00:00Z'),
    pageTitle: 'Other Page Two',
    domain: 'other.org',
    caseId: 'case-abc',
  },
]

vi.mock('../../src/lib/prisma', () => ({
  default: {
    evidence: {
      findMany: vi.fn().mockResolvedValue(MOCK_EVIDENCE),
    },
  },
}))

import { vi } from 'vitest'

describe('D5-export-csv – API route layer', () => {
  it('responds with a CSV file attachment (Content-Disposition: attachment)', async () => {
    const req = new Request('http://localhost/api/cases/case-abc/export', { method: 'GET' })
    const res = await GET(req, { params: { id: 'case-abc' } })

    expect(res.status).toBe(200)
    const disposition = res.headers.get('content-disposition') ?? ''
    expect(disposition.toLowerCase()).toContain('attachment')
    expect(disposition.toLowerCase()).toContain('.csv')
  })

  it('response body is CSV with url, detectedAt, pageTitle, domain columns for every evidence row', async () => {
    const req = new Request('http://localhost/api/cases/case-abc/export', { method: 'GET' })
    const res = await GET(req, { params: { id: 'case-abc' } })

    const body = await res.text()
    const lines = body.trim().split('\n')

    const header = lines[0]!.toLowerCase()
    expect(header).toContain('url')
    expect(header).toContain('detectedat')
    expect(header).toContain('pagetitle')
    expect(header).toContain('domain')

    expect(lines.length).toBe(MOCK_EVIDENCE.length + 1)

    for (let i = 0; i < MOCK_EVIDENCE.length; i++) {
      const row = lines[i + 1]!
      expect(row).toContain(MOCK_EVIDENCE[i]!.url)
      expect(row).toContain(MOCK_EVIDENCE[i]!.pageTitle)
      expect(row).toContain(MOCK_EVIDENCE[i]!.domain)
    }
  })
})
