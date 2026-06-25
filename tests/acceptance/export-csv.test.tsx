import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import EvidenceList from '../../src/components/EvidenceList'

const MOCK_EVIDENCE = [
  {
    id: 'e1',
    url: 'https://example.com/page1',
    detectedAt: '2026-06-01T10:00:00Z',
    pageTitle: 'Example Page One',
    domain: 'example.com',
  },
  {
    id: 'e2',
    url: 'https://test.org/page2',
    detectedAt: '2026-06-02T11:00:00Z',
    pageTitle: 'Test Page Two',
    domain: 'test.org',
  },
]

describe('D5-export-csv UI: export control triggers file download', () => {
  let createObjectURLSpy: ReturnType<typeof vi.fn>
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>
  let clickSpy: ReturnType<typeof vi.fn>
  let appendChildSpy: ReturnType<typeof vi.fn>
  let removeChildSpy: ReturnType<typeof vi.fn>
  let anchorElement: HTMLAnchorElement

  beforeEach(() => {
    createObjectURLSpy = vi.fn(() => 'blob:mock-url')
    revokeObjectURLSpy = vi.fn()
    vi.stubGlobal('URL', {
      createObjectURL: createObjectURLSpy,
      revokeObjectURL: revokeObjectURLSpy,
    })

    anchorElement = document.createElement('a')
    clickSpy = vi.fn()
    anchorElement.click = clickSpy

    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation(
      (tag: string, ...args: [ElementCreationOptions?]) => {
        if (tag === 'a') return anchorElement
        return originalCreateElement(tag, ...args)
      },
    )

    appendChildSpy = vi.fn()
    removeChildSpy = vi.fn()
    vi.spyOn(document.body, 'appendChild').mockImplementation(appendChildSpy)
    vi.spyOn(document.body, 'removeChild').mockImplementation(removeChildSpy)

    vi.stubGlobal(
      'fetch',
      vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
        new Response(
          JSON.stringify(MOCK_EVIDENCE),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('activating the export control triggers a file download, not inline render or redirect', async () => {
    render(<EvidenceList caseId="case-1" />)

    const exportButton = await screen.findByRole('button', { name: /export.*csv/i })
    fireEvent.click(exportButton)

    await waitFor(() => {
      expect(createObjectURLSpy).toHaveBeenCalledTimes(1)
    })

    expect(clickSpy).toHaveBeenCalledTimes(1)
    const downloadAttr = anchorElement.getAttribute('download')
    expect(downloadAttr).toBeTruthy()
  })
})
