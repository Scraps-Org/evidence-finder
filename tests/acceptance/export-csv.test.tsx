import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import EvidenceList from '../../src/components/EvidenceList'

const EVIDENCE = [
  {
    id: '1',
    url: 'https://example.com/page1',
    detectedAt: '2026-06-01T12:00:00.000Z',
    pageTitle: 'Example Page 1',
    domain: 'example.com',
  },
  {
    id: '2',
    url: 'https://example.com/page2',
    detectedAt: '2026-06-02T12:00:00.000Z',
    pageTitle: 'Example Page 2',
    domain: 'example.com',
  },
]

describe('D5-export-csv: export control triggers file download', () => {
  let createObjectURLSpy: ReturnType<typeof vi.fn>
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>
  let appendChildSpy: ReturnType<typeof vi.spyOn>
  let clickSpy: ReturnType<typeof vi.fn>
  let anchorEl: HTMLAnchorElement

  beforeEach(() => {
    createObjectURLSpy = vi.fn(() => 'blob:http://localhost/fake')
    revokeObjectURLSpy = vi.fn()
    vi.stubGlobal('URL', {
      createObjectURL: createObjectURLSpy,
      revokeObjectURL: revokeObjectURLSpy,
    })

    clickSpy = vi.fn()
    anchorEl = document.createElement('a')
    anchorEl.click = clickSpy
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') return anchorEl
      return document.createElement.call(document, tag) as HTMLElement
    })
    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node)
    vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('triggers a file download (not inline render or redirect) when the export control is activated', () => {
    render(<EvidenceList evidence={EVIDENCE} caseId="case-1" />)

    const exportButton = screen.getByRole('button', { name: /export.*csv/i })
    fireEvent.click(exportButton)

    expect(createObjectURLSpy).toHaveBeenCalledOnce()
    const blobArg = createObjectURLSpy.mock.calls[0]![0] as Blob
    expect(blobArg).toBeInstanceOf(Blob)

    expect(appendChildSpy).toHaveBeenCalledWith(anchorEl)
    expect(clickSpy).toHaveBeenCalledOnce()

    expect(anchorEl.download).toBeTruthy()
    expect(anchorEl.href).toBe('blob:http://localhost/fake')
  })
})
