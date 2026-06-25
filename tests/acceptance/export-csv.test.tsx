import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import Page from '../../src/app/page'

describe('D5-export-csv – UI layer', () => {
  const evidenceRows = [
    {
      id: 'ev-1',
      url: 'https://example.com/page1',
      detectedAt: '2026-06-01T10:00:00.000Z',
      pageTitle: 'Page One',
      domain: 'example.com',
    },
    {
      id: 'ev-2',
      url: 'https://example.com/page2',
      detectedAt: '2026-06-02T11:00:00.000Z',
      pageTitle: 'Page Two',
      domain: 'example.com',
    },
  ]

  let anchorClickSpy: ReturnType<typeof vi.fn>
  let createdAnchors: HTMLAnchorElement[]

  beforeEach(() => {
    createdAnchors = []
    anchorClickSpy = vi.fn()

    const originalCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation(
      (tag: string, options?: ElementCreationOptions) => {
        const el = originalCreate(tag, options)
        if (tag === 'a') {
          const anchor = el as HTMLAnchorElement
          vi.spyOn(anchor, 'click').mockImplementation(anchorClickSpy)
          createdAnchors.push(anchor)
        }
        return el
      },
    )

    vi.stubGlobal(
      'fetch',
      vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockImplementation(
        async (input: RequestInfo | URL) => {
          const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url
          if (url.includes('/api/cases')) {
            return new Response(
              JSON.stringify([{ id: 'case-1', name: 'Test Case' }]),
              { status: 200, headers: { 'content-type': 'application/json' } },
            )
          }
          if (url.includes('/api/evidence')) {
            return new Response(
              JSON.stringify(evidenceRows),
              { status: 200, headers: { 'content-type': 'application/json' } },
            )
          }
          if (url.includes('/api/export') || url.includes('export')) {
            const csv = [
              'url,detectedAt,pageTitle,domain',
              ...evidenceRows.map(
                (r) => `${r.url},${r.detectedAt},${r.pageTitle},${r.domain}`,
              ),
            ].join('\n')
            return new Response(csv, {
              status: 200,
              headers: { 'content-type': 'text/csv', 'content-disposition': 'attachment; filename="export.csv"' },
            })
          }
          return new Response('{}', { status: 404 })
        },
      ),
    )

    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn(),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('activating the export control triggers a file download (not inline render or redirect)', async () => {
    render(<Page />)

    const exportButton = await waitFor(() =>
      screen.getByRole('button', { name: /export/i }),
    )

    fireEvent.click(exportButton)

    await waitFor(() => {
      expect(anchorClickSpy).toHaveBeenCalled()
    })

    const downloadAnchor = createdAnchors.find((a) => a.download !== '')
    expect(downloadAnchor).toBeDefined()
    expect(downloadAnchor!.download).not.toBe('')
  })
})
