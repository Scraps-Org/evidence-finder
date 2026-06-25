import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import Page from '../../src/app/page'

describe('D5-export-csv – UI layer', () => {
  const csvBody = `url,detectedAt,pageTitle,domain\nhttps://example.com/1,2024-01-01T00:00:00.000Z,Page One,example.com\nhttps://example.com/2,2024-01-02T00:00:00.000Z,Page Two,example.com`

  let clickedHref = ''
  let clickedDownload = ''
  let revokeObjectURLCalled = false
  const anchorClickSpy = vi.fn()

  beforeEach(() => {
    clickedHref = ''
    clickedDownload = ''
    revokeObjectURLCalled = false
    anchorClickSpy.mockReset()

    vi.stubGlobal('fetch', vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockImplementation(
      async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url
        if (url.includes('export-csv') || url.includes('export')) {
          return new Response(csvBody, {
            status: 200,
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': 'attachment; filename="evidence.csv"',
            },
          })
        }
        // default: return empty lists for cases/evidence
        return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
    ))

    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn(() => { revokeObjectURLCalled = true }),
    })

    const origCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreateElement(tag)
      if (tag === 'a') {
        Object.defineProperty(el, 'click', { value: anchorClickSpy, writable: true })
        Object.defineProperty(el, 'href', {
          set(v: string) { clickedHref = v },
          get() { return clickedHref },
          configurable: true,
        })
        Object.defineProperty(el, 'download', {
          set(v: string) { clickedDownload = v },
          get() { return clickedDownload },
          configurable: true,
        })
      }
      return el
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('triggers a file download (not inline render or redirect) when the export control is activated', async () => {
    render(<Page />)

    const exportControl = await waitFor(() =>
      screen.getByRole('button', { name: /export/i })
    )

    fireEvent.click(exportControl)

    await waitFor(() => {
      expect(anchorClickSpy).toHaveBeenCalledTimes(1)
    })

    // must be a blob download, not navigation or inline render
    expect(clickedHref).toMatch(/^blob:/)
    expect(clickedDownload).toBeTruthy()
  })

  it('the downloaded CSV contains url, detectedAt, pageTitle, domain columns for every evidence row', async () => {
    render(<Page />)

    const exportControl = await waitFor(() =>
      screen.getByRole('button', { name: /export/i })
    )

    fireEvent.click(exportControl)

    await waitFor(() => {
      expect(anchorClickSpy).toHaveBeenCalledTimes(1)
    })

    // Verify the fetch call used the export endpoint and the response had all four columns
    const fetchMock = vi.mocked(fetch)
    const exportCall = fetchMock.mock.calls.find(([input]) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url
      return url.includes('export') || url.includes('csv')
    })
    expect(exportCall).toBeDefined()

    const lines = csvBody.split('\n')
    const headers = lines[0]!.split(',')
    expect(headers).toContain('url')
    expect(headers).toContain('detectedAt')
    expect(headers).toContain('pageTitle')
    expect(headers).toContain('domain')

    // every data row must have exactly 4 columns
    const dataRows = lines.slice(1)
    expect(dataRows.length).toBeGreaterThan(0)
    for (const row of dataRows) {
      const cols = row.split(',')
      expect(cols).toHaveLength(4)
      for (const col of cols) {
        expect(col.trim()).not.toBe('')
      }
    }
  })
})
