import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import Page from '../../src/app/page'

describe('case-creation-ui', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('submits non-empty identifying terms to POST /api/cases and shows the saved case in the list', async () => {
    const mockFetch = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
      new Response(
        JSON.stringify({ id: 1, identifyingTerms: 'John Doe 1985' }),
        { status: 201, headers: { 'Content-Type': 'application/json' } },
      ),
    )
    vi.stubGlobal('fetch', mockFetch)

    render(<Page />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'John Doe 1985' } })
    fireEvent.click(screen.getByRole('button', { name: /submit|create|add|search/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/cases'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('John Doe 1985'),
        }),
      )
    })

    await waitFor(() => {
      expect(screen.getByText(/John Doe 1985/)).toBeInTheDocument()
    })
  })

  it('does not submit when identifying terms are empty', async () => {
    const mockFetch = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>()
    vi.stubGlobal('fetch', mockFetch)

    render(<Page />)

    fireEvent.click(screen.getByRole('button', { name: /submit|create|add|search/i }))

    await new Promise((r) => setTimeout(r, 50))
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('does not submit when identifying terms are whitespace-only', async () => {
    const mockFetch = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>()
    vi.stubGlobal('fetch', mockFetch)

    render(<Page />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: /submit|create|add|search/i }))

    await new Promise((r) => setTimeout(r, 50))
    expect(mockFetch).not.toHaveBeenCalled()
  })
})
