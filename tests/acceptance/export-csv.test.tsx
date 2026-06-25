import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import EvidenceList from '../../src/components/EvidenceList'

describe('D5-export-csv: UI – export control triggers download', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('activating the export control triggers a file download, not inline render or redirect', () => {
    const evidence = [
      {
        id: '1',
        url: 'https://example.com/page1',
        detectedAt: '2026-01-01T00:00:00.000Z',
        pageTitle: 'Example Page',
        domain: 'example.com',
      },
      {
        id: '2',
        url: 'https://example.com/page2',
        detectedAt: '2026-01-02T00:00:00.000Z',
        pageTitle: 'Second Page',
        domain: 'example.com',
      },
    ]

    const createObjectURLSpy = vi.fn(() => 'blob:fake-url')
    const revokeObjectURLSpy = vi.fn()
    vi.stubGlobal('URL', {
      createObjectURL: createObjectURLSpy,
      revokeObjectURL: revokeObjectURLSpy,
    })

    const clickSpy = vi.fn()
    const anchorEl = {
      href: '',
      download: '',
      click: clickSpy,
      style: {},
    }
    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tag: string) => {
        if (tag === 'a') return anchorEl as unknown as HTMLAnchorElement
        return document.createElement(tag)
      })
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockReturnValue(anchorEl as unknown as HTMLAnchorElement)
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockReturnValue(anchorEl as unknown as HTMLAnchorElement)

    render(<EvidenceList evidence={evidence} caseId="case-1" />)

    const exportButton = screen.getByRole('button', { name: /export.*csv/i })
    fireEvent.click(exportButton)

    expect(createObjectURLSpy).toHaveBeenCalledOnce()
    expect(clickSpy).toHaveBeenCalledOnce()

    createElementSpy.mockRestore()
    appendChildSpy.mockRestore()
    removeChildSpy.mockRestore()
  })
})
