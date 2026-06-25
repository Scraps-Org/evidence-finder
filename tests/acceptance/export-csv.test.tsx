import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Page from '../../src/app/page'

describe('D5-export-csv – UI: export control triggers file download', () => {
  let anchorClickSpy: ReturnType<typeof vi.fn>
  let createdAnchor: HTMLAnchorElement
  let originalCreateElement: typeof document.createElement
  let createObjectURLSpy: ReturnType<typeof vi.fn>
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    createObjectURLSpy = vi.fn(() => 'blob:http://localhost/fake-url')
    revokeObjectURLSpy = vi.fn()
    vi.stubGlobal('URL', {
      createObjectURL: createObjectURLSpy,
      revokeObjectURL: revokeObjectURLSpy,
    })

    anchorClickSpy = vi.fn()
    originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation(
      (tag: string, ...args: [ElementCreationOptions?]) => {
        if (tag === 'a') {
          createdAnchor = originalCreateElement('a') as HTMLAnchorElement
          createdAnchor.click = anchorClickSpy
          return createdAnchor
        }
        return originalCreateElement(tag, ...args)
      },
    )

    vi.stubGlobal(
      'fetch',
      vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>(() =>
        Promise.resolve(
          new Response(
            JSON.stringify([
              {
                id: '1',
                url: 'https://example.com',
                detectedAt: '2026-01-01T00:00:00.000Z',
                pageTitle: 'Example Page',
                domain: 'example.com',
                caseId: 'case-1',
              },
            ]),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        ),
      ),
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('activating the export control triggers a file download, not inline render or redirect', async () => {
    render(<Page />)

    const exportButton = await screen.findByRole('button', { name: /export.*csv/i })
    fireEvent.click(exportButton)

    expect(anchorClickSpy).toHaveBeenCalledOnce()
    expect(createdAnchor.download).toMatch(/\.csv$/i)
    expect(createdAnchor.href).not.toBe('')
  })
})
