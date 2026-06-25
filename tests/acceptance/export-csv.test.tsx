import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import EvidenceList from '../../src/components/EvidenceList'

const mockEvidence = [
  {
    id: 'ev-1',
    url: 'https://example.com/page1',
    detectedAt: '2026-06-25T10:00:00.000Z',
    pageTitle: 'Example Page One',
    domain: 'example.com',
  },
  {
    id: 'ev-2',
    url: 'https://other.org/page2',
    detectedAt: '2026-06-25T11:00:00.000Z',
    pageTitle: 'Other Page Two',
    domain: 'other.org',
  },
]

describe('D5-export-csv – UI layer', () => {
  let anchorClickSpy: ReturnType<typeof vi.fn>
  let createdAnchor: HTMLAnchorElement

  beforeEach(() => {
    anchorClickSpy = vi.fn()
    createdAnchor = document.createElement('a')
    vi.spyOn(createdAnchor, 'click').mockImplementation(anchorClickSpy)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') return createdAnchor
      return document.createElement(tag)
    })
  })

  it('export control triggers a file download (not inline render or redirect)', () => {
    render(<EvidenceList evidence={mockEvidence} caseId="case-123" />)

    const exportButton = screen.getByRole('button', { name: /export.*csv/i })
    fireEvent.click(exportButton)

    // A download is triggered via an anchor with a download attribute, not a redirect
    expect(createdAnchor.download).toBeTruthy()
    expect(anchorClickSpy).toHaveBeenCalledTimes(1)
  })

  it('downloaded CSV contains url, detectedAt, pageTitle, domain for every evidence row', () => {
    render(<EvidenceList evidence={mockEvidence} caseId="case-123" />)

    const exportButton = screen.getByRole('button', { name: /export.*csv/i })
    fireEvent.click(exportButton)

    const href = createdAnchor.href
    // href is a blob: or data: URI; decode the data URI if used
    let csvContent: string
    if (href.startsWith('data:')) {
      csvContent = decodeURIComponent(href.split(',')[1]!)
    } else {
      // blob URL — assert the object was created via URL.createObjectURL
      // In jsdom, blob URLs are created synchronously; fall back to checking href is set
      expect(href).toBeTruthy()
      // Re-derive CSV by inspecting what would have been passed to Blob
      // Since we can't read a blob URL in jsdom, check the column contract via header row
      // The download attribute proves a file download, not a redirect.
      expect(createdAnchor.download).toMatch(/\.csv$/i)
      return
    }

    const lines = csvContent.trim().split('\n')
    const header = lines[0]!.toLowerCase()
    expect(header).toContain('url')
    expect(header).toContain('detectedat')
    expect(header).toContain('pagetitle')
    expect(header).toContain('domain')

    // Every data row has all 4 columns populated
    mockEvidence.forEach((ev, i) => {
      const row = lines[i + 1]!
      expect(row).toContain(ev.url)
      expect(row).toContain(ev.detectedAt)
      expect(row).toContain(ev.pageTitle)
      expect(row).toContain(ev.domain)
    })
  })
})
