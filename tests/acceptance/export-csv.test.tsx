import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import EvidenceList from '../../src/components/EvidenceList'

const MOCK_EVIDENCE = [
  {
    id: '1',
    url: 'https://example.com/page1',
    detectedAt: '2024-01-15T10:00:00Z',
    pageTitle: 'Example Page One',
    domain: 'example.com',
  },
  {
    id: '2',
    url: 'https://test.org/page2',
    detectedAt: '2024-01-16T11:30:00Z',
    pageTitle: 'Test Page Two',
    domain: 'test.org',
  },
]

describe('D5-export-csv: export control triggers a file download', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('clicking the export control triggers a download (createElement + click), not a redirect or inline render', () => {
    const createdLinks: HTMLAnchorElement[] = []
    const origCreate = document.createElement.bind(document)
    const createSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tag: string) => {
        const el = origCreate(tag)
        if (tag === 'a') {
          createdLinks.push(el as HTMLAnchorElement)
        }
        return el
      })

    render(<EvidenceList evidence={MOCK_EVIDENCE} caseId="case-1" />)

    const exportBtn = screen.getByRole('button', { name: /export.*csv/i })
    fireEvent.click(exportBtn)

    createSpy.mockRestore()

    const downloadLink = createdLinks.find(
      (a) => a.download !== '' || a.getAttribute('download') !== null
    )
    expect(
      downloadLink,
      'Expected a hidden <a download="..."> to be created for the CSV download'
    ).toBeDefined()
  })

  it('the CSV blob URL is set on the anchor (not a page navigation href)', () => {
    const anchors: HTMLAnchorElement[] = []
    const origCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreate(tag)
      if (tag === 'a') anchors.push(el as HTMLAnchorElement)
      return el
    })

    render(<EvidenceList evidence={MOCK_EVIDENCE} caseId="case-1" />)
    fireEvent.click(screen.getByRole('button', { name: /export.*csv/i }))

    vi.restoreAllMocks()

    const downloadAnchor = anchors.find(
      (a) => a.download !== '' || a.getAttribute('download') !== null
    )
    expect(downloadAnchor).toBeDefined()
    expect(downloadAnchor!.href).toMatch(/^blob:/)
  })
})
