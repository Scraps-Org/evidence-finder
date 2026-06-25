import { describe, it, expect } from 'vitest'
import { GET } from '../../src/app/api/cases/[id]/export/route'

const REQUIRED_COLUMNS = ['url', 'detectedAt', 'pageTitle', 'domain']

const fakeEvidence = [
  {
    id: 'ev-1',
    url: 'https://example.com/page',
    detectedAt: new Date('2026-06-25T10:00:00.000Z'),
    pageTitle: 'Example Page',
    domain: 'example.com',
    caseId: 'case-1',
  },
  {
    id: 'ev-2',
    url: 'https://other.org/article',
    detectedAt: new Date('2026-06-24T08:30:00.000Z'),
    pageTitle: 'Other Article',
    domain: 'other.org',
    caseId: 'case-1',
  },
]

vi.mock('../../src/lib/prisma', () => {
  const evidence = {
    findMany: vi.fn().mockResolvedValue(fakeEvidence),
  }
  return { default: { evidence } }
})

import { vi } from 'vitest'

describe('D5-export-csv: GET /api/cases/[id]/export returns a downloadable CSV', () => {
  it('triggers file download — responds with attachment Content-Disposition, not inline', async () => {
    const req = new Request('http://localhost/api/cases/case-1/export', { method: 'GET' })
    const res = await GET(req, { params: { id: 'case-1' } })

    expect(res.status).toBe(200)

    const contentType = res.headers.get('content-type') ?? ''
    expect(contentType).toMatch(/text\/csv/i)

    const disposition = res.headers.get('content-disposition') ?? ''
    expect(disposition).toMatch(/attachment/i)
    expect(disposition).not.toMatch(/inline/i)
  })

  it('all evidence rows contain url, detectedAt, pageTitle, domain columns', async () => {
    const req = new Request('http://localhost/api/cases/case-1/export', { method: 'GET' })
    const res = await GET(req, { params: { id: 'case-1' } })

    const csvText = await res.text()
    const lines = csvText.trim().split('\n')

    expect(lines.length).toBeGreaterThanOrEqual(2)

    const header = lines[0]!.toLowerCase()
    for (const col of REQUIRED_COLUMNS) {
      expect(header, `header should contain column "${col}"`).toContain(col.toLowerCase())
    }

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i]!
      const ev = fakeEvidence[i - 1]!
      expect(row).toContain(ev.url)
      expect(row).toContain(ev.pageTitle)
      expect(row).toContain(ev.domain)
    }
  })
})
