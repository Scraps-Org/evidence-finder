import { describe, it, expect, vi, beforeEach } from 'vitest'

// Stub Prisma before importing the route so the module resolves without a real DB
vi.mock('../../src/lib/prisma', () => {
  const evidence = [
    {
      id: 'ev-1',
      url: 'https://example.com/page-one',
      detectedAt: new Date('2024-01-01T00:00:00.000Z'),
      pageTitle: 'Page One',
      domain: 'example.com',
      caseId: 'case-1',
    },
    {
      id: 'ev-2',
      url: 'https://example.com/page-two',
      detectedAt: new Date('2024-01-02T00:00:00.000Z'),
      pageTitle: 'Page Two',
      domain: 'example.com',
      caseId: 'case-1',
    },
  ]
  return {
    default: {
      evidence: {
        findMany: vi.fn().mockResolvedValue(evidence),
      },
    },
  }
})

import { GET } from '../../src/app/api/cases/[id]/export-csv/route'

describe('D5-export-csv – API route layer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('triggers a file download response (attachment disposition, not inline) for a case with evidence', async () => {
    const req = new Request('http://localhost/api/cases/case-1/export-csv', { method: 'GET' })
    const params = Promise.resolve({ id: 'case-1' })

    const res = await GET(req, { params })

    expect(res.status).toBe(200)

    const disposition = res.headers.get('Content-Disposition') ?? ''
    expect(disposition).toMatch(/attachment/i)
    // must not be inline
    expect(disposition).not.toMatch(/^inline/i)
  })

  it('returns text/csv content type', async () => {
    const req = new Request('http://localhost/api/cases/case-1/export-csv', { method: 'GET' })
    const params = Promise.resolve({ id: 'case-1' })

    const res = await GET(req, { params })

    const contentType = res.headers.get('Content-Type') ?? ''
    expect(contentType).toMatch(/text\/csv/i)
  })

  it('CSV body contains url, detectedAt, pageTitle, domain columns for every evidence row', async () => {
    const req = new Request('http://localhost/api/cases/case-1/export-csv', { method: 'GET' })
    const params = Promise.resolve({ id: 'case-1' })

    const res = await GET(req, { params })
    const text = await res.text()

    const lines = text.trim().split('\n').filter(Boolean)
    expect(lines.length).toBeGreaterThanOrEqual(2) // header + at least 1 data row

    const headers = lines[0]!.split(',')
    expect(headers).toContain('url')
    expect(headers).toContain('detectedAt')
    expect(headers).toContain('pageTitle')
    expect(headers).toContain('domain')

    const dataRows = lines.slice(1)
    for (const row of dataRows) {
      const cols = row.split(',')
      // 4 columns: url, detectedAt, pageTitle, domain
      expect(cols).toHaveLength(4)
      for (const col of cols) {
        expect(col.trim()).not.toBe('')
      }
    }
  })

  it('every data row has non-empty values for all four required columns', async () => {
    const req = new Request('http://localhost/api/cases/case-1/export-csv', { method: 'GET' })
    const params = Promise.resolve({ id: 'case-1' })

    const res = await GET(req, { params })
    const text = await res.text()

    const lines = text.trim().split('\n').filter(Boolean)
    const headerLine = lines[0]!.split(',')
    const urlIdx = headerLine.indexOf('url')
    const detectedAtIdx = headerLine.indexOf('detectedAt')
    const pageTitleIdx = headerLine.indexOf('pageTitle')
    const domainIdx = headerLine.indexOf('domain')

    expect(urlIdx).toBeGreaterThanOrEqual(0)
    expect(detectedAtIdx).toBeGreaterThanOrEqual(0)
    expect(pageTitleIdx).toBeGreaterThanOrEqual(0)
    expect(domainIdx).toBeGreaterThanOrEqual(0)

    const dataRows = lines.slice(1)
    expect(dataRows.length).toBeGreaterThan(0)
    for (const row of dataRows) {
      const cols = row.split(',')
      expect(cols[urlIdx]!.trim()).not.toBe('')
      expect(cols[detectedAtIdx]!.trim()).not.toBe('')
      expect(cols[pageTitleIdx]!.trim()).not.toBe('')
      expect(cols[domainIdx]!.trim()).not.toBe('')
    }
  })
})
