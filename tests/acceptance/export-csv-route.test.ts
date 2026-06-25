import { describe, it, expect } from 'vitest'
import { GET } from '../../src/app/api/cases/[id]/export/route'

const CASE_ID = 'test-case-export-001'

const makeRequest = (caseId: string) =>
  new Request(`http://localhost/api/cases/${caseId}/export`, { method: 'GET' })

describe('D5-export-csv: GET /api/cases/[id]/export returns downloadable CSV', () => {
  it('responds with Content-Disposition attachment and text/csv content type', async () => {
    const res = await GET(makeRequest(CASE_ID), { params: { id: CASE_ID } })

    expect(res.status).toBe(200)
    const contentType = res.headers.get('content-type') ?? ''
    expect(contentType).toMatch(/text\/csv/i)
    const disposition = res.headers.get('content-disposition') ?? ''
    expect(disposition).toMatch(/attachment/i)
    expect(disposition).toMatch(/\.csv/i)
  })

  it('CSV body contains url, detectedAt, pageTitle, domain header columns', async () => {
    const res = await GET(makeRequest(CASE_ID), { params: { id: CASE_ID } })
    const body = await res.text()

    const header = body.split('\n')[0]!.toLowerCase()
    expect(header).toContain('url')
    expect(header).toContain('detectedat')
    expect(header).toContain('pagetitle')
    expect(header).toContain('domain')
  })
})