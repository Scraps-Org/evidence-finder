import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import EvidenceList from '../../src/components/EvidenceList'

const FAKE_EVIDENCE = [
  {
    id: 'e1',
    url: 'https://example.com/page1',
    detectedAt: '2024-01-15T10:00:00Z',
    pageTitle: 'Example Page One',
    domain: 'example.com',
  },
  {
    id: 'e2',
    url: 'https://other.org/page2',
    detectedAt: '2024-01-16T11:30:00Z',
    pageTitle: 'Other Page Two',
    domain: 'other.org',
  },
]

describe('D5-export-csv: UI — export control triggers download', () => {
  let createObjectURLSpy: ReturnType<typeof vi.fn>
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>
  let appendChildSpy: ReturnType<typeof vi.spyOn>
  let clickSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    createObjectURLSpy = vi.fn(() => 'blob:fake-url')
    revokeObjectURLSpy = vi.fn()
    vi.stubGlobal('URL', {
      createObjectURL: createObjectURLSpy,
      revokeObjectURL: revokeObjectURLSpy,
    })

    clickSpy = vi.fn()
    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
      if (node instanceof HTMLAnchorElement) {
        node.click = clickSpy
      }
      return node
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    appendChildSpy.mockRestore()
  })

  it('triggers a file download (not inline render or redirect) when the export control is activated', async () => {
    render(<EvidenceList evidence={FAKE_EVIDENCE} caseId="case-1" />)

    const exportButton = screen.getByRole('button', { name: /export.*csv/i })
    fireEvent.click(exportButton)

    await waitFor(() => {
      expect(createObjectURLSpy).toHaveBeenCalledTimes(1)
      const blobArg: Blob = createObjectURLSpy.mock.calls[0]![0] as Blob
      expect(blobArg).toBeInstanceOf(Blob)
    })

    expect(clickSpy).toHaveBeenCalledTimes(1)
  })

  it('generated CSV contains url, detectedAt, pageTitle, domain columns for every evidence row', async () => {
    render(<EvidenceList evidence={FAKE_EVIDENCE} caseId="case-1" />)

    const exportButton = screen.getByRole('button', { name: /export.*csv/i })
    fireEvent.click(exportButton)

    await waitFor(() => {
      expect(createObjectURLSpy).toHaveBeenCalledTimes(1)
    })

    const blobArg: Blob = createObjectURLSpy.mock.calls[0]![0] as Blob
    const csvText = await blobArg.text()
    const lines = csvText.trim().split('\n')

    const header = lines[0]!
    expect(header).toMatch(/url/i)
    expect(header).toMatch(/detectedAt/i)
    expect(header).toMatch(/pageTitle/i)
    expect(header).toMatch(/domain/i)

    expect(lines.length).toBeGreaterThanOrEqual(3)

    for (const evidence of FAKE_EVIDENCE) {
      const matchingLine = lines.slice(1).find((line) => line.includes(evidence.url))
      expect(matchingLine, `row for ${evidence.url} not found in CSV`).toBeDefined()
      expect(matchingLine).toContain(evidence.detectedAt)
      expect(matchingLine).toContain(evidence.pageTitle)
      expect(matchingLine).toContain(evidence.domain)
    }
  })
})
