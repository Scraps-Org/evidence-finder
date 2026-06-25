import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import EvidenceList from '../../src/components/EvidenceList'

const EVIDENCE = [
  {
    id: 'ev-1',
    url: 'https://example.com/page1',
    detectedAt: '2024-01-15T10:00:00.000Z',
    pageTitle: 'Example Page One',
    domain: 'example.com',
  },
  {
    id: 'ev-2',
    url: 'https://other.org/page2',
    detectedAt: '2024-02-20T12:30:00.000Z',
    pageTitle: 'Other Page Two',
    domain: 'other.org',
  },
]

describe('D5-export-csv – UI layer', () => {
  let createObjectURLSpy: ReturnType<typeof vi.fn>
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>
  let appendChildSpy: ReturnType<typeof vi.fn>
  let clickSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    clickSpy = vi.fn()
    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node)
    createObjectURLSpy = vi.fn(() => 'blob:fake-url')
    revokeObjectURLSpy = vi.fn()
    vi.stubGlobal('URL', {
      createObjectURL: createObjectURLSpy,
      revokeObjectURL: revokeObjectURLSpy,
    })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(clickSpy)
  })

  it('triggers a file download (not inline render or redirect) when the export control is activated', () => {
    render(<EvidenceList evidence={EVIDENCE} caseId="case-1" />)

    const exportControl = screen.getByRole('button', { name: /export/i })
    fireEvent.click(exportControl)

    // A blob URL must be created — proves a downloadable file was generated
    expect(createObjectURLSpy).toHaveBeenCalledOnce()
    const blobArg: unknown = createObjectURLSpy.mock.calls[0]?.[0]
    expect(blobArg).toBeInstanceOf(Blob)

    // A synthetic anchor click (download) must fire — not navigation/redirect
    expect(clickSpy).toHaveBeenCalledOnce()

    // The anchor must carry a download attribute (proves file download, not navigation)
    const anchorCalls = appendChildSpy.mock.calls
    const anchor = anchorCalls.find(
      (args) => args[0] instanceof HTMLAnchorElement
    )?.[0] as HTMLAnchorElement | undefined
    expect(anchor?.download).toBeTruthy()
  })
})
