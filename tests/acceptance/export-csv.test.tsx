import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import EvidenceList from '../../src/components/EvidenceList'

const mockEvidence = [
  {
    id: 'ev-1',
    url: 'https://example.com/page',
    detectedAt: '2026-06-25T10:00:00.000Z',
    pageTitle: 'Example Page',
    domain: 'example.com',
  },
  {
    id: 'ev-2',
    url: 'https://other.org/article',
    detectedAt: '2026-06-24T08:30:00.000Z',
    pageTitle: 'Other Article',
    domain: 'other.org',
  },
]

describe('D5-export-csv: export control triggers file download', () => {
  let createObjectURLSpy: ReturnType<typeof vi.fn>
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>
  let appendChildSpy: ReturnType<typeof vi.spyOn>
  let clickSpy: ReturnType<typeof vi.fn>
  let anchorElement: HTMLAnchorElement

  beforeEach(() => {
    createObjectURLSpy = vi.fn(() => 'blob:http://localhost/fake-url')
    revokeObjectURLSpy = vi.fn()
    vi.stubGlobal('URL', {
      createObjectURL: createObjectURLSpy,
      revokeObjectURL: revokeObjectURLSpy,
    })

    clickSpy = vi.fn()
    anchorElement = document.createElement('a')
    anchorElement.click = clickSpy
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') return anchorElement
      return document.createElement.call(document, tag)
    })
    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node)
    vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('activating the export control triggers a file download, not inline render or redirect', async () => {
    render(<EvidenceList evidence={mockEvidence} />)

    const exportControl = screen.getByRole('button', { name: /export.*csv/i })
    fireEvent.click(exportControl)

    await waitFor(() => {
      expect(createObjectURLSpy).toHaveBeenCalledOnce()
    })

    expect(clickSpy).toHaveBeenCalledOnce()
    expect(appendChildSpy).toHaveBeenCalled()

    const blobArg = createObjectURLSpy.mock.calls[0]![0] as Blob
    expect(blobArg).toBeInstanceOf(Blob)
    expect(blobArg.type).toMatch(/text\/csv/i)

    expect(anchorElement.download).toMatch(/\.csv$/i)
    expect(anchorElement.href).toBe('blob:http://localhost/fake-url')
  })

  it('all evidence rows in the CSV contain url, detectedAt, pageTitle, domain columns', async () => {
    render(<EvidenceList evidence={mockEvidence} />)

    const exportControl = screen.getByRole('button', { name: /export.*csv/i })
    fireEvent.click(exportControl)

    await waitFor(() => {
      expect(createObjectURLSpy).toHaveBeenCalledOnce()
    })

    const blobArg = createObjectURLSpy.mock.calls[0]![0] as Blob
    const csvText = await blobArg.text()
    const lines = csvText.trim().split('\n')

    const header = lines[0]!.toLowerCase()
    expect(header).toContain('url')
    expect(header).toContain('detectedat')
    expect(header).toContain('pagetitle')
    expect(header).toContain('domain')

    expect(lines.length).toBe(mockEvidence.length + 1)

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i]!
      const ev = mockEvidence[i - 1]!
      expect(row).toContain(ev.url)
      expect(row).toContain(ev.detectedAt)
      expect(row).toContain(ev.pageTitle)
      expect(row).toContain(ev.domain)
    }
  })
})
