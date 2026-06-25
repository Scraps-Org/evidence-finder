import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import EvidenceList from '../../src/components/EvidenceList'

const EVIDENCE_ROWS = [
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
    detectedAt: '2026-06-02T11:30:00.000Z',
    pageTitle: 'Other Page Two',
    domain: 'other.org',
  },
]

describe('D5-export-csv: CSV export control', () => {
  let anchorClick: ReturnType<typeof vi.fn>
  let createdAnchor: HTMLAnchorElement

  beforeEach(() => {
    anchorClick = vi.fn()
    createdAnchor = document.createElement('a')
    vi.spyOn(createdAnchor, 'click').mockImplementation(anchorClick)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') return createdAnchor
      return document.createElement(tag)
    })
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
  })

  it('triggers a file download (not inline render or redirect) when the export control is activated', () => {
    render(<EvidenceList evidence={EVIDENCE_ROWS} />)

    const exportControl =
      screen.getByRole('button', { name: /export|csv|download/i })

    fireEvent.click(exportControl)

    expect(anchorClick).toHaveBeenCalledTimes(1)
    expect(createdAnchor.download).toMatch(/\.csv$/i)
    expect(createdAnchor.href).not.toBe('')
  })

  it('CSV content contains url, detectedAt, pageTitle, domain columns for every evidence row', () => {
    let capturedBlob: Blob | undefined
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      capturedBlob = blob as Blob
      return 'blob:mock-url'
    })

    render(<EvidenceList evidence={EVIDENCE_ROWS} />)

    const exportControl =
      screen.getByRole('button', { name: /export|csv|download/i })

    fireEvent.click(exportControl)

    expect(capturedBlob).toBeDefined()

    return capturedBlob!.text().then((csv) => {
      const lines = csv.split('\n').filter((l) => l.trim() !== '')

      const header = lines[0]!.toLowerCase()
      expect(header).toContain('url')
      expect(header).toContain('detectedat')
      expect(header).toContain('pagetitle')
      expect(header).toContain('domain')

      expect(lines.length).toBe(EVIDENCE_ROWS.length + 1)

      const dataLine1 = lines[1]!
      expect(dataLine1).toContain(EVIDENCE_ROWS[0]!.url)
      expect(dataLine1).toContain(EVIDENCE_ROWS[0]!.domain)
      expect(dataLine1).toContain(EVIDENCE_ROWS[0]!.pageTitle)
      expect(dataLine1).toContain(EVIDENCE_ROWS[0]!.detectedAt)

      const dataLine2 = lines[2]!
      expect(dataLine2).toContain(EVIDENCE_ROWS[1]!.url)
      expect(dataLine2).toContain(EVIDENCE_ROWS[1]!.domain)
      expect(dataLine2).toContain(EVIDENCE_ROWS[1]!.pageTitle)
      expect(dataLine2).toContain(EVIDENCE_ROWS[1]!.detectedAt)
    })
  })
})
