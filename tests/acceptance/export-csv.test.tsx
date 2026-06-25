import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import EvidenceList from '../../src/components/EvidenceList'

const EVIDENCE_ROWS = [
  {
    id: '1',
    url: 'https://example.com/page1',
    detectedAt: '2026-06-01T10:00:00.000Z',
    pageTitle: 'Page One',
    domain: 'example.com',
  },
  {
    id: '2',
    url: 'https://example.com/page2',
    detectedAt: '2026-06-02T11:00:00.000Z',
    pageTitle: 'Page Two',
    domain: 'example.com',
  },
]

describe('D5-export-csv — UI layer', () => {
  let createdObjectUrl: string
  let clickedAnchorHref: string
  let clickedAnchorDownload: string
  let anchorClickSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    createdObjectUrl = ''
    clickedAnchorHref = ''
    clickedAnchorDownload = ''
    anchorClickSpy = vi.fn()

    vi.stubGlobal(
      'URL',
      class MockURL {
        static createObjectURL(blob: Blob): string {
          createdObjectUrl = `blob:mock-${blob.size}`
          return createdObjectUrl
        }
        static revokeObjectURL(_url: string): void {}
      },
    )

    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation(
      (tag: string): HTMLElement => {
        if (tag === 'a') {
          const anchor = originalCreateElement('a') as HTMLAnchorElement
          const originalClick = anchor.click.bind(anchor)
          anchor.click = () => {
            clickedAnchorHref = anchor.href
            clickedAnchorDownload = anchor.download
            anchorClickSpy()
            originalClick()
          }
          return anchor
        }
        return originalCreateElement(tag)
      },
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('triggers a file download (not inline render or redirect) when the export control is activated', async () => {
    render(<EvidenceList evidence={EVIDENCE_ROWS} />)

    const exportBtn = screen.getByRole('button', { name: /export.*csv/i })
    fireEvent.click(exportBtn)

    await waitFor(() => {
      expect(anchorClickSpy).toHaveBeenCalledTimes(1)
    })

    expect(clickedAnchorDownload).toBeTruthy()
    expect(clickedAnchorHref).not.toBe('')
    // must NOT be a navigation / redirect (same-page or new tab without download attr)
    expect(clickedAnchorDownload).toMatch(/\.csv$/i)
  })

  it('CSV content contains url, detectedAt, pageTitle, domain columns for every evidence row', async () => {
    let capturedBlob: Blob | null = null

    vi.stubGlobal(
      'URL',
      class MockURL2 {
        static createObjectURL(blob: Blob): string {
          capturedBlob = blob
          return 'blob:mock'
        }
        static revokeObjectURL(_url: string): void {}
      },
    )

    render(<EvidenceList evidence={EVIDENCE_ROWS} />)

    const exportBtn = screen.getByRole('button', { name: /export.*csv/i })
    fireEvent.click(exportBtn)

    await waitFor(() => {
      expect(capturedBlob).not.toBeNull()
    })

    const csvText = await (capturedBlob as Blob).text()
    const lines = csvText.trim().split('\n')

    // header row must declare all four columns
    const header = lines[0]!.toLowerCase()
    expect(header).toContain('url')
    expect(header).toContain('detectedat')
    expect(header).toContain('pagetitle')
    expect(header).toContain('domain')

    // one data row per evidence item
    expect(lines.length).toBe(EVIDENCE_ROWS.length + 1)

    for (let i = 0; i < EVIDENCE_ROWS.length; i++) {
      const row = lines[i + 1]!
      expect(row).toContain(EVIDENCE_ROWS[i]!.url)
      expect(row).toContain(EVIDENCE_ROWS[i]!.detectedAt)
      expect(row).toContain(EVIDENCE_ROWS[i]!.pageTitle)
      expect(row).toContain(EVIDENCE_ROWS[i]!.domain)
    }
  })
})
