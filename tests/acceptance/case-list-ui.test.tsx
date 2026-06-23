import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import EvidenceFinder from '../../src/components/EvidenceFinder'

describe('Case list UI shows saved case', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('displays the saved case identifyingTerms in the list after submission', async () => {
    const terms = `Jane Doe ${Date.now()}`
    const createdCase = { id: '1', identifyingTerms: terms, createdAt: new Date().toISOString() }

    vi.stubGlobal(
      'fetch',
      vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>()
        .mockResolvedValueOnce(
          new Response(JSON.stringify(createdCase), {
            status: 201,
            headers: { 'content-type': 'application/json' },
          }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify([createdCase]), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
        ),
    )

    render(<EvidenceFinder />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: terms } })

    const submitBtn = screen.getByRole('button', { name: /submit|search|add|save|create/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(terms)).toBeInTheDocument()
    })
  })
})
