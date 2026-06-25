import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import EvidenceList from '../../src/components/EvidenceList'

const EVIDENCE = [
  {
    id: '1',
    url: 'https://example.com/page1',
    detectedAt: '2026-06-01T10:00:00Z',
    pageTitle: 'Example Page One',
    domain: 'example.com',
  },
  {
    id: '2',
    url: 'https://other.org/page2',
    detectedAt: '2026-06-02T12:00:00Z',
    pageTitle: 'Other Page Two',
    domain: 'other.org',
  },
]

describe('D5-export-csv – UI layer', () => {
  beforeEach(() => {
    // Stub URL.createObjectURL and URL.revokeObjectURL (jsdom doesn't implement them)
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:http://localhost/fake-object-url'),
      revokeObjectURL: vi.fn(),
    })
  })

  it('triggers a file download (not inline render or redirect) when export control is activated', () => {
    const appendChildSpy = vi.spyOn(document.body, 'appendChild')
    const removeChildSpy = vi.spyOn(document.body, 'removeChild')

    render(<EvidenceList evidence={EVIDENCE} />)

    const exportControl = screen.getByRole('button', { name: /export.*csv/i })
    fireEvent.click(exportControl)

    // A programmatic <a download> must have been appended to trigger the download
    const appendedAnchor = appendChildSpy.mock.calls
      .map((args) => args[0])
      .find((el): el is HTMLAnchorElement => el instanceof HTMLAnchorElement && el.download !== '')

    expect(appendedAnchor).toBeDefined()
    expect(appendedAnchor!.download).toMatch(/\.csv$/i)
    // Must not open inline or redirect
    expect(appendedAnchor!.target).not.toBe('_blank')
    expect(appendedAnchor!.href).toMatch(/^blob:/)

    removeChildSpy.mockRestore()
    appendChildSpy.mockRestore()
  })

  it('CSV blob contains url, detectedAt, pageTitle, domain for every evidence row', () => {
    let capturedBlob: Blob | undefined
    const createObjectURL = vi.fn((b: Blob) => {
      capturedBlob = b
      return 'blob:http://localhost/fake'
    })
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL: vi.fn() })

    render(<EvidenceList evidence={EVIDENCE} />)

    const exportControl = screen.getByRole('button', { name: /export.*csv/i })
    fireEvent.click(exportControl)

    expect(capturedBlob).toBeDefined()

    return capturedBlob!.text().then((csv) => {
      const lines = csv.trim().split('\n')
      // Header line must contain all four columns
      const header = lines[0]!.toLowerCase()
      expect(header).toContain('url')
      expect(header).toContain('detectedat')
      expect(header).toContain('pagetitle')
      expect(header).toContain('domain')

      // One data line per evidence item
      expect(lines.length).toBe(EVIDENCE.length + 1)

      for (let i = 0; i < EVIDENCE.length; i++) {
        const row = lines[i + 1]!
        expect(row).toContain(EVIDENCE[i]!.url)
        expect(row).toContain(EVIDENCE[i]!.detectedAt)
        expect(row).toContain(EVIDENCE[i]!.pageTitle)
        expect(row).toContain(EVIDENCE[i]!.domain)
      }
    })
  })
})
