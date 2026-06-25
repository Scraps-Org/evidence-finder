import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Page from '../../src/app/page'

describe('D5-export-csv – UI: export control triggers file download', () => {
  beforeEach(() => {
    // Stub fetch so the page can mount without a real server
    const mockEvidence = [
      {
        id: '1',
        url: 'https://example.com/page1',
        detectedAt: '2026-06-25T10:00:00.000Z',
        pageTitle: 'Example Page',
        domain: 'example.com',
      },
    ]

    vi.stubGlobal(
      'fetch',
      vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockImplementation(
        (input: RequestInfo | URL) => {
          const url = typeof input === 'string' ? input : input.toString()
          if (url.includes('/api/cases')) {
            return Promise.resolve(
              new Response(JSON.stringify([{ id: 'case-1', name: 'Case One' }]), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              }),
            )
          }
          if (url.includes('/api/evidence')) {
            return Promise.resolve(
              new Response(JSON.stringify(mockEvidence), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              }),
            )
          }
          if (url.includes('/api/export-csv')) {
            return Promise.resolve(
              new Response(
                'url,detectedAt,pageTitle,domain\nhttps://example.com/page1,2026-06-25T10:00:00.000Z,Example Page,example.com',
                {
                  status: 200,
                  headers: { 'Content-Type': 'text/csv' },
                },
              ),
            )
          }
          return Promise.resolve(new Response('{}', { status: 200 }))
        },
      ),
    )
  })

  it('activating the export control triggers a download, not inline render or redirect', async () => {
    // Spy on URL.createObjectURL and document.createElement to detect blob-download pattern
    const createObjectURL = vi.fn<[Blob | MediaSource], string>().mockReturnValue('blob:test/fake-url')
    const revokeObjectURL = vi.fn<[string], void>()
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL,
      revokeObjectURL,
    })

    const clickSpy = vi.fn<[], void>()
    const anchorEl = {
      href: '',
      download: '',
      click: clickSpy,
      style: {},
    }
    const originalCreateElement = document.createElement.bind(document)
    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tag: string) => {
        if (tag === 'a') {
          return anchorEl as unknown as HTMLElement
        }
        return originalCreateElement(tag)
      })

    render(<Page />)

    // The export control must be present in the rendered page
    const exportButton = screen.getByRole('button', { name: /export.*csv/i })
    fireEvent.click(exportButton)

    // Allow any async work (fetch, blob creation) to settle
    await vi.waitFor(() => {
      // Either URL.createObjectURL was called (blob download) OR the anchor was programmatically clicked
      const blobDownload = createObjectURL.mock.calls.length > 0
      const anchorDownload = clickSpy.mock.calls.length > 0
      expect(blobDownload || anchorDownload).toBe(true)
    })

    // Must NOT have navigated the page (no location change, no inline render)
    // The page should still show the export button after the action
    expect(screen.getByRole('button', { name: /export.*csv/i })).toBeTruthy()

    createElementSpy.mockRestore()
    vi.unstubAllGlobals()
  })
})
