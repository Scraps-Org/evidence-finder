import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import EvidenceList from '../../src/components/EvidenceList'

const MOCK_EVIDENCE = [
  {
    id: 'e1',
    url: 'https://example.com/page1',
    detectedAt: '2026-06-01T10:00:00.000Z',
    pageTitle: 'Example Page One',
    domain: 'example.com',
  },
  {
    id: 'e2',
    url: 'https://other.org/page2',
    detectedAt: '2026-06-02T12:00:00.000Z',
    pageTitle: 'Other Page Two',
    domain: 'other.org',
  },
]

describe('D5-export-csv UI', () => {
  let anchorClickSpy: ReturnType<typeof vi.fn>
  let createObjectURLSpy: ReturnType<typeof vi.fn>
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>
  let appendChildSpy: ReturnType<typeof vi.fn>
  let removeChildSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    anchorClickSpy = vi.fn()
    createObjectURLSpy = vi.fn(() => 'blob:mock-url')
    revokeObjectURLSpy = vi.fn()

    vi.stubGlobal('URL', {
      createObjectURL: createObjectURLSpy,
      revokeObjectURL: revokeObjectURLSpy,
    })

    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node)
    removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node)

    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(anchorClickSpy)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('triggers a file download (not inline render or redirect) when export control is activated', () => {
    render(<EvidenceList evidence={MOCK_EVIDENCE} />)

    const exportButton = screen.getByRole('button', { name: /export/i })
    fireEvent.click(exportButton)

    expect(anchorClickSpy).toHaveBeenCalledTimes(1)
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1)
  })
})
