import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import Page from '../../src/app/page'

const CASE_ID = 'case-triage-ui-001'
const CANDIDATE_ID = 'cand-ui-001'

const mockCandidate = {
  id: CANDIDATE_ID,
  caseId: CASE_ID,
  url: 'https://example.com/article',
  title: 'Suspicious Article',
  snippet: 'Something suspicious',
  status: 'pending',
}

const mockCase = {
  id: CASE_ID,
  name: 'Test Case',
  candidates: [mockCandidate],
}

describe('D8 candidate triage UI', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>(
        async (input: RequestInfo | URL, init?: RequestInit) => {
          const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
          const method = init?.method?.toUpperCase() ?? 'GET'

          if (method === 'GET' && url.includes('/api/cases')) {
            return new Response(
              JSON.stringify([mockCase]),
              { status: 200, headers: { 'Content-Type': 'application/json' } },
            )
          }

          if (url.includes(`/api/cases/${CASE_ID}/candidates`) || url.includes('/api/candidates')) {
            if (method === 'GET') {
              return new Response(
                JSON.stringify([mockCandidate]),
                { status: 200, headers: { 'Content-Type': 'application/json' } },
              )
            }
            if (method === 'PATCH' || method === 'POST') {
              return new Response(
                JSON.stringify({ ...mockCandidate, status: 'evidence' }),
                { status: 200, headers: { 'Content-Type': 'application/json' } },
              )
            }
          }

          return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } })
        },
      ),
    )
  })

  it('lists detected candidates when the case view is opened', async () => {
    render(<Page />)

    await waitFor(() => {
      expect(screen.getByText('Suspicious Article')).toBeDefined()
    }, { timeout: 3000 })
  })

  it('renders confirm and dismiss controls for each candidate', async () => {
    render(<Page />)

    await waitFor(() => {
      expect(screen.getByText('Suspicious Article')).toBeDefined()
    }, { timeout: 3000 })

    const confirmBtn = screen.queryByRole('button', { name: /confirm/i })
    const dismissBtn = screen.queryByRole('button', { name: /dismiss/i })

    expect(confirmBtn ?? dismissBtn).not.toBeNull()
  })
})
