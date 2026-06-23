import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Page from '../../src/app/page'

describe('landing page — case list', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders saved cases from the database in the list after creation', async () => {
    const mockFetch = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ id: 42, identifyingTerms: 'Alice Wonder 1992' }),
          { status: 201, headers: { 'Content-Type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([{ id: 42, identifyingTerms: 'Alice Wonder 1992' }]),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      )
    vi.stubGlobal('fetch', mockFetch)

    const { default: fireEvent } = await import('@testing-library/react').then(
      (m) => ({ default: m.fireEvent }),
    )

    const { waitFor } = await import('@testing-library/react')

    render(<Page />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Alice Wonder 1992' } })
    fireEvent.click(screen.getByRole('button', { name: /submit|create|add|search/i }))

    await waitFor(() => {
      expect(screen.getByText(/Alice Wonder 1992/)).toBeInTheDocument()
    })
  })
})
