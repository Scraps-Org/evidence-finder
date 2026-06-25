import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import EvidenceList from '../../src/components/EvidenceList'

describe('D5-export-csv UI', () => {
  const evidence = [
    {
      id: '1',
      url: 'https://example.com/page1',
      detectedAt: new Date('2024-01-15T10:00:00Z').toISOString(),
      pageTitle: 'Example Page One',
      domain: 'example.com',
    },
    {
      id: '2',
      url: 'https://other.org/page2',
      detectedAt: new Date('2024-01-16T12:00:00Z').toISOString(),
      pageTitle: 'Other Page Two',
      domain: 'other.org',
    },
  ]

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('triggers a file download (not inline render or redirect) when the export control is activated', () => {
    const createObjectURL = vi.fn(() => 'blob:http://localhost/fake-url')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', {
      createObjectURL,
      revokeObjectURL,
    })

    const clickSpy = vi.fn()
    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreateElement(tag)
      if (tag === 'a') {
        Object.defineProperty(el, 'click', { value: clickSpy, writable: true })
        Object.defineProperty(el, 'download', { value: '', writable: true })
        Object.defineProperty(el, 'href', { value: '', writable: true })
      }
      return el
    })

    render(<EvidenceList evidence={evidence} caseId="case-123" />)

    const exportControl = screen.getByRole('button', { name: /export/i })
    fireEvent.click(exportControl)

    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(clickSpy).toHaveBeenCalledOnce()
  })

  it('downloaded CSV contains url, detectedAt, pageTitle, domain columns for every evidence row', () => {
    let capturedBlob: Blob | undefined
    const createObjectURL = vi.fn((blob: Blob) => {
      capturedBlob = blob
      return 'blob:http://localhost/fake-url'
    })
    vi.stubGlobal('URL', {
      createObjectURL,
      revokeObjectURL: vi.fn(),
    })

    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreateElement(tag)
      if (tag === 'a') {
        Object.defineProperty(el, 'click', { value: vi.fn(), writable: true })
        Object.defineProperty(el, 'download', { value: '', writable: true })
        Object.defineProperty(el, 'href', { value: '', writable: true })
      }
      return el
    })

    render(<EvidenceList evidence={evidence} caseId="case-123" />)
    fireEvent.click(screen.getByRole('button', { name: /export/i }))

    expect(capturedBlob).toBeDefined()

    return capturedBlob!.text().then((csvText) => {
      const lines = csvText.trim().split('\n')
      // header row
      expect(lines[0]).toMatch(/url/i)
      expect(lines[0]).toMatch(/detectedAt/i)
      expect(lines[0]).toMatch(/pageTitle/i)
      expect(lines[0]).toMatch(/domain/i)

      // one data row per evidence item
      expect(lines).toHaveLength(evidence.length + 1)

      for (const ev of evidence) {
        const row = lines.find((l) => l.includes(ev.url))
        expect(row).toBeDefined()
        expect(row).toContain(ev.url)
        expect(row).toContain(ev.detectedAt)
        expect(row).toContain(ev.pageTitle)
        expect(row).toContain(ev.domain)
      }
    })
  })
})
