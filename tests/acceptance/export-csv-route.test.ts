import { describe, it, expect, vi } from 'vitest'

// The route handler is imported directly — no fetch mocking.
// Path follows Next.js App Router convention for a dynamic segment.
import { GET } from '../../src/app/api/cases/[caseId]/export/route'

vi.mock('../../src/lib/prisma', () => {
  const evidence = [
    {
      id: 'ev-a',
      url: 'https://alpha.io/foo',
      detectedAt: new Date('2026-06-25T08:00:00.000Z'),
      pageTitle: 'Alpha Foo',
      domain: 'alpha.io',
    },
    {
      id: 'ev-b',
      url: 'https://beta.io/bar',
      detectedAt: new Date('2026-06-25T09:00:00.000Z'),
      pageTitle: 'Beta Bar',
      domain: 'beta.io',
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

describe('D5-export-csv – API route layer', () => {
  it('responds with 200 and Content-Disposition attachment (file download, not inline)', async () => {
    const req = new Request('http://localhost/api/cases/case-abc/export', { method: 'GET' })
    const res = await GET(req, { params: { caseId: 'case-abc' } })

    expect(res.status).toBe(200)
    const disposition = res.headers.get('Content-Disposition') ?? ''
    expect(disposition.toLowerCase()).toContain('attachment')
    expect(disposition.toLowerCase()).toContain('.csv')
  })

  it('response body CSV contains url, detectedAt, pageTitle, domain columns for every evidence row', async () => {
    const req = new Request('http://localhost/api/cases/case-abc/export', { method: 'GET' })
    const res = await GET(req, { params: { caseId: 'case-abc' } })

    const text = await res.text()
    const lines = text.trim().split('\n')
    const header = lines[0]!.toLowerCase()

    expect(header).toContain('url')
    expect(header).toContain('detectedat')
    expect(header).toContain('pagetitle')
    expect(header).toContain('domain')

    // Row 1
    expect(lines[1]).toContain('alpha.io/foo')
    expect(lines[1]).toContain('Alpha Foo')
    expect(lines[1]).toContain('alpha.io')

    // Row 2
    expect(lines[2]).toContain('beta.io/bar')
    expect(lines[2]).toContain('Beta Bar')
    expect(lines[2]).toContain('beta.io')
  })
})
