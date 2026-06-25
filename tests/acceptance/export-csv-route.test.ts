import { describe, it, expect } from 'vitest'
import { GET } from '../../src/app/api/cases/[id]/export/route'

describe('D5-export-csv – API route layer', () => {
  const evidenceRows = [
    {
      id: 'ev-1',
      url: 'https://example.com/page1',
      detectedAt: new Date('2026-06-01T10:00:00.000Z'),
      pageTitle: 'Page One',
      domain: 'example.com',
    },
    {
      id: 'ev-2',
      url: 'https://example.com/page2',
      detectedAt: new Date('2026-06-02T11:00:00.000Z'),
      pageTitle: 'Page Two',
      domain: 'example.com',
    },
  ]

  it('returns a CSV attachment (not inline, not redirect) when evidence exists', async () => {
    vi.mock('../../src/lib/prisma', () => ({
      default: {
        evidence: {
          findMany: vi.fn().mockResolvedValue(evidenceRows),
        },
        case: {
          findUnique: vi.fn().mockResolvedValue({ id: 'case-1', name: 'Test Case' }),
        },
      },
    }))

    const req = new Request('http://localhost/api/cases/case-1/export', { method: 'GET' })
    const res = await GET(req, { params: { id: 'case-1' } })

    expect(res.status).toBe(200)

    const contentType = res.headers.get('content-type') ?? ''
    expect(contentType.toLowerCase()).toContain('text/csv')

    const disposition = res.headers.get('content-disposition') ?? ''
    expect(disposition.toLowerCase()).toContain('attachment')
    expect(disposition.toLowerCase()).not.toContain('inline')
  })

  it('CSV body contains url, detectedAt, pageTitle, domain columns for every evidence row', async () => {
    vi.mock('../../src/lib/prisma', () => ({
      default: {
        evidence: {
          findMany: vi.fn().mockResolvedValue(evidenceRows),
        },
        case: {
          findUnique: vi.fn().mockResolvedValue({ id: 'case-1', name: 'Test Case' }),
        },
      },
    }))

    const req = new Request('http://localhost/api/cases/case-1/export', { method: 'GET' })
    const res = await GET(req, { params: { id: 'case-1' } })

    const body = await res.text()
    const lines = body.trim().split('\n').map((l) => l.trim())

    const header = lines[0]!
    const columns = header.split(',')
    expect(columns).toContain('url')
    expect(columns).toContain('detectedAt')
    expect(columns).toContain('pageTitle')
    expect(columns).toContain('domain')

    const dataLines = lines.slice(1)
    expect(dataLines.length).toBe(evidenceRows.length)

    const urlIdx = columns.indexOf('url')
    const detectedAtIdx = columns.indexOf('detectedAt')
    const pageTitleIdx = columns.indexOf('pageTitle')
    const domainIdx = columns.indexOf('domain')

    for (const [i, row] of dataLines.entries()) {
      const cells = row.split(',')
      const ev = evidenceRows[i]!
      expect(cells[urlIdx]).toBe(ev.url)
      expect(cells[detectedAtIdx]).toBeTruthy()
      expect(cells[pageTitleIdx]).toBe(ev.pageTitle)
      expect(cells[domainIdx]).toBe(ev.domain)
    }
  })
})
