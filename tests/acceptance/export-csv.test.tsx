import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import EvidenceList from '../../src/components/EvidenceList'

const FAKE_CASE_ID = 'case-abc-123'

const fakeEvidence = [
  {
    id: 'ev-1',
    url: 'https://example.com/page1',
    detectedAt: '2026-06-01T10:00:00.000Z',
    pageTitle: 'Example Page One',
    domain: 'example.com',
  },
  {
    id: 'ev-2',
    url: 'https://other.org/page2',
    detectedAt: '2026-06-02T11:00:00.000Z',
    pageTitle: 'Other Page Two',
    domain: 'other.org',
  },
]

describe('D5-export-csv: export control triggers file download', () => {
  let createdObjectUrl: string | undefined
  let clickedAnchor: HTMLAnchorElement | undefined
  const revokeObjectURL = vi.fn()

  beforeEach(() => {
    vi.stubGlobal(
      'URL',
      Object.assign({}, URL, {
        createObjectURL: (blob: Blob) => {
          expect(blob).toBeInstanceOf(Blob)
          createdObjectUrl = 'blob:fake-url'
          return createdObjectUrl
        },
        revokeObjectURL,
      }),
    )

    const origCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation(
      (tag: string, ...rest: Parameters<typeof document.createElement> extends [string, ...infer R] ? R : never[]) => {
        const el = origCreate(tag, ...(rest as []))
        if (tag === 'a') {
          clickedAnchor = el as HTMLAnchorElement
          vi.spyOn(el as HTMLAnchorElement, 'click').mockImplementation(() => {})
        }
        return el
      },
    )

    vi.stubGlobal(
      'fetch',
      vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
        new Response(
          JSON.stringify(fakeEvidence),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    createdObjectUrl = undefined
    clickedAnchor = undefined
  })

  it('activating the export control triggers a file download, not inline render or redirect', async () => {
    render(<EvidenceList caseId={FAKE_CASE_ID} />)

    const exportBtn = await screen.findByRole('button', { name: /export.*csv|download.*csv|csv/i })

    fireEvent.click(exportBtn)

    await waitFor(() => {
      expect(createdObjectUrl).toBe('blob:fake-url')
    })

    expect(clickedAnchor).toBeDefined()
    const anchor = clickedAnchor!
    expect(anchor.download).toMatch(/\.csv$/i)
    expect(anchor.href).not.toBe('')

    expect(document.body.contains(anchor)).toBe(false)
  })
})
