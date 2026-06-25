import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import EvidenceList from '../../src/components/EvidenceList'

const EVIDENCE_ROWS = [
  {
    id: '1',
    url: 'https://example.com/page1',
    detectedAt: '2026-06-25T10:00:00.000Z',
    pageTitle: 'Example Page One',
    domain: 'example.com',
  },
  {
    id: '2',
    url: 'https://other.org/page2',
    detectedAt: '2026-06-24T09:00:00.000Z',
    pageTitle: 'Other Page Two',
    domain: 'other.org',
  },
]

describe('D5-export-csv: CSV export control', () => {
  let createdObjectUrls: string[]
  let revokedObjectUrls: string[]
  let clickedAnchors: { href: string; download: string }[]

  beforeEach(() => {
    createdObjectUrls = []
    revokedObjectUrls = []
    clickedAnchors = []

    vi.stubGlobal(
      'URL',
      Object.assign(
        function URL(url: string) {
          return { href: url }
        },
        {
          createObjectURL: (blob: Blob) => {
            const fakeUrl = `blob:fake-${createdObjectUrls.length}`
            createdObjectUrls.push(fakeUrl)
            return fakeUrl
          },
          revokeObjectURL: (url: string) => {
            revokedObjectUrls.push(url)
          },
        },
      ),
    )

    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreateElement(tag)
      if (tag === 'a') {
        vi.spyOn(el as HTMLAnchorElement, 'click').mockImplementation(() => {
          clickedAnchors.push({
            href: (el as HTMLAnchorElement).href,
            download: (el as HTMLAnchorElement).download,
          })
        })
      }
      return el
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('triggers a file download (not inline render or redirect) when the export control is activated', () => {
    render(<EvidenceList evidence={EVIDENCE_ROWS} caseId="case-1" />)

    const exportBtn = screen.getByRole('button', { name: /export.*csv/i })
    fireEvent.click(exportBtn)

    expect(createdObjectUrls.length).toBeGreaterThan(0)
    expect(clickedAnchors.length).toBeGreaterThan(0)
    const anchor = clickedAnchors[0]!
    expect(anchor.download).toMatch(/\.csv$/i)
  })

  it('CSV content includes url, detectedAt, pageTitle, domain columns for every evidence row', async () => {
    let capturedBlob: Blob | null = null
    vi.stubGlobal(
      'URL',
      Object.assign(
        function URL(url: string) {
          return { href: url }
        },
        {
          createObjectURL: (blob: Blob) => {
            capturedBlob = blob
            return 'blob:captured'
          },
          revokeObjectURL: (_url: string) => undefined,
        },
      ),
    )

    render(<EvidenceList evidence={EVIDENCE_ROWS} caseId="case-1" />)

    const exportBtn = screen.getByRole('button', { name: /export.*csv/i })
    fireEvent.click(exportBtn)

    expect(capturedBlob).not.toBeNull()
    const csvText = await (capturedBlob as unknown as Blob).text()

    const lines = csvText.trim().split('\n')
    const header = lines[0]!
    expect(header).toMatch(/url/i)
    expect(header).toMatch(/detectedAt/i)
    expect(header).toMatch(/pageTitle/i)
    expect(header).toMatch(/domain/i)

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
