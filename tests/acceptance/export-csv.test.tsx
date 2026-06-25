import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import EvidenceList from '../../src/components/EvidenceList'

const mockEvidence = [
  {
    id: '1',
    url: 'https://example.com/page1',
    detectedAt: '2026-06-01T10:00:00.000Z',
    pageTitle: 'Example Page 1',
    domain: 'example.com',
  },
  {
    id: '2',
    url: 'https://other.org/page2',
    detectedAt: '2026-06-02T11:00:00.000Z',
    pageTitle: 'Other Page 2',
    domain: 'other.org',
  },
]

describe('D5-export-csv: export control triggers download', () => {
  beforeEach(() => {
    // Stub URL.createObjectURL and URL.revokeObjectURL for jsdom
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn<[Blob], string>(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn<[string], void>(),
    })
  })

  it('triggers a file download (not inline render or redirect) when the export control is activated', () => {
    const clickSpy = vi.fn<[], void>()

    // Intercept anchor click to capture download behavior
    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation(
      (tag: string, ...args: [ElementCreationOptions?]) => {
        const el = originalCreateElement(tag, ...args)
        if (tag === 'a') {
          Object.defineProperty(el, 'click', { value: clickSpy, writable: true })
        }
        return el
      }
    )

    render(<EvidenceList evidence={mockEvidence} caseId="case-1" />)

    const exportControl = screen.getByRole('button', { name: /export/i })
    fireEvent.click(exportControl)

    expect(clickSpy).toHaveBeenCalledTimes(1)

    vi.restoreAllMocks()
  })

  it('sets a download attribute on the anchor (not a navigation or inline render)', () => {
    let capturedAnchor: HTMLAnchorElement | null = null

    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation(
      (tag: string, ...args: [ElementCreationOptions?]) => {
        const el = originalCreateElement(tag, ...args)
        if (tag === 'a') {
          capturedAnchor = el as HTMLAnchorElement
        }
        return el
      }
    )

    render(<EvidenceList evidence={mockEvidence} caseId="case-2" />)

    const exportControl = screen.getByRole('button', { name: /export/i })
    fireEvent.click(exportControl)

    expect(capturedAnchor).not.toBeNull()
    expect((capturedAnchor as unknown as HTMLAnchorElement).download).toMatch(/\.csv$/i)

    vi.restoreAllMocks()
  })
})
