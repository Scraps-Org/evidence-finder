import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Page from '../../src/app/page'

describe('D2-case-input: case-creation UI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('submits non-empty identifying terms to the API route and shows the saved case in the list', async () => {
    const savedCase = { id: '1', identifyingTerms: 'Jane Doe' }

    vi.stubGlobal(
      'fetch',
      vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>()
        .mockImplementationOnce(() =>
          Promise.resolve(
            new Response(JSON.stringify(savedCase), {
              status: 201,
              headers: { 'Content-Type': 'application/json' },
            }),
          ),
        )
        .mockImplementationOnce(() =>
          Promise.resolve(
            new Response(JSON.stringify([savedCase]), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }),
          ),
        ),
    )

    render(<Page />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Jane Doe' } })
    fireEvent.click(screen.getByRole('button', { name: /submit|create|add|save/i }))

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    })

    const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls
    const postCall = calls.find(
      (c: unknown[]) => (c[1] as RequestInit | undefined)?.method === 'POST',
    )
    expect(postCall).toBeDefined()
    const body = JSON.parse((postCall![1] as RequestInit).body as string) as Record<string, unknown>
    expect(body.identifyingTerms).toBe('Jane Doe')
  })

  it('does not submit and shows no POST when input is empty', async () => {
    const fetchMock = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>()
    vi.stubGlobal('fetch', fetchMock)

    render(<Page />)

    const button = screen.getByRole('button', { name: /submit|create|add|save/i })
    fireEvent.click(button)

    await new Promise((r) => setTimeout(r, 50))

    const postCalls = fetchMock.mock.calls.filter(
      (c: unknown[]) => (c[1] as RequestInit | undefined)?.method === 'POST',
    )
    expect(postCalls).toHaveLength(0)
  })
})
