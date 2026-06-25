import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import EvidenceList from '../../src/components/EvidenceList'

const MOCK_EVIDENCE = [
  {
    id: '1',
    url: 'https://example.com/page1',
    detectedAt: '2026-06-25T10:00:00Z',
    pageTitle: 'Example Page One',
    domain: 'example.com',
  },
  {
    id: '2',
    url: 'https://example.com/page2',
    detectedAt: '2026-06-25T11:00:00Z',
    pageTitle: 'Example Page Two',
    domain: 'example.com',
  },
]

describe('D5-export-csv: Export control triggers file download', () => {
  let anchorClick: ReturnType<typeof vi.fn>
  let createdAnchor: HTMLAnchorElement
  let originalCreateElement: typeof document.createElement

  beforeEach(() => {
    anchorClick = vi.fn()

    originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation(
      (tag: string, ...args: [ElementCreationOptions?]) => {
        if (tag === 'a') {
          createdAnchor = originalCreateElement('a') as HTMLAnchorElement
          createdAnchor.click = anchorClick
          return createdAnchor
        }
        return originalCreateElement(tag, ...args)
      },
    )

    vi.stubGlobal(
      'URL',
      Object.assign(
        class {
          static createObjectURL = vi.fn(() => 'blob:fake-url')
          static revokeObjectURL = vi.fn()
        },
        { createObjectURL: vi.fn(() => 'blob:fake-url'), revokeObjectURL: vi.fn() },
      ),
    )

    URL.createObjectURL = vi.fn(() => 'blob:fake-url')
    URL.revokeObjectURL = vi.fn()
  })

  it('activating the export control triggers a file download, not inline render or redirect', async () => {
    render(<EvidenceList evidence={MOCK_EVIDENCE} />)

    const exportControl = screen.getByRole('button', { name: /export.*csv/i })
    fireEvent.click(exportControl)

    await waitFor(() => {
      expect(anchorClick).toHaveBeenCalledTimes(1)
    })

    // Must use download attribute (file download), not href navigation
    expect(createdAnchor.download).toMatch(/\.csv$/i)
    // Must NOT open inline in browser window (no target=_blank or window.open)
    expect(createdAnchor.target).not.toBe('_blank')
  })

  it('downloaded CSV contains url, detectedAt, pageTitle, domain columns for every evidence row', async () => {
    let capturedBlob: Blob | undefined
    const originalCreateObjectURL = URL.createObjectURL
    URL.createObjectURL = vi.fn((b: Blob | MediaSource) => {
      if (b instanceof Blob) capturedBlob = b
      return 'blob:fake-url'
    })

    render(<EvidenceList evidence={MOCK_EVIDENCE} />)

    const exportControl = screen.getByRole('button', { name: /export.*csv/i })
    fireEvent.click(exportControl)

    await waitFor(() => {
      expect(capturedBlob).toBeDefined()
    })

    const csvText = await capturedBlob!.text()
    const lines = csvText.trim().split('\n')

    // Header row must contain all four required columns
    const header = lines[0]!.toLowerCase()
    expect(header).toContain('url')
    expect(header).toContain('detectedat')
    expect(header).toContain('pagetitle')
    expect(header).toContain('domain')

    // One data row per evidence item
    expect(lines.length).toBe(MOCK_EVIDENCE.length + 1)

    // Every data row must have the same number of columns as the header
    const headerCols = lines[0]!.split(',').length
    for (let i = 1; i < lines.length; i++) {
      const rowCols = lines[i]!.split(',').length
      expect(rowCols).toBe(headerCols)
    }

    // Spot-check actual values appear in CSV
    expect(csvText).toContain('https://example.com/page1')
    expect(csvText).toContain('example.com')
    expect(csvText).toContain('Example Page One')

    URL.createObjectURL = originalCreateObjectURL
  })
})