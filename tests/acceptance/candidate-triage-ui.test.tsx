import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import Page from '../../src/app/page'

const CASE_ID = 'case-ui-triage-1'
const CANDIDATE_ID = 'cand-ui-1'

const mockCandidate = {
  id: CANDIDATE_ID,
  caseId: CASE_ID,
  url: 'https://example.com/candidate',
  title: 'Suspect Candidate',
  snippet: 'Some snippet text',
  status: 'pending',
}

const mockCase = {
  id: CASE_ID,
  name: 'Test Case',
  candidates: [mockCandidate],
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>(
      (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString()
        if (url.includes('/api/cases') && !url.includes('candidates') && !url.includes('export') && !url.includes('search')) {
          return Promise.resolve(
            new Response(JSON.stringify([mockCase]), { status: 200, headers: { 'content-type': 'application/json' } }),
          )
        }
        if (url.includes('/api/cases') && url.includes(CASE_ID) && url.includes('candidates')) {
          return Promise.resolve(
            new Response(JSON.stringify([mockCandidate]), { status: 200, headers: { 'content-type': 'application/json' } }),
          )
        }
        if (url.includes('/api/evidence')) {
          return Promise.resolve(
            new Response(JSON.stringify([]), { status: 200, headers: { 'content-type': 'application/json' } }),
          )
        }
        return Promise.resolve(
          new Response(JSON.stringify({}), { status: 200, headers: { 'content-type': 'application/json' } }),
        )
      },
    ),
  )
})

describe('candidate triage UI', () => {
  it('lists detected candidates in the case view', async () => {
    render(<Page />)
    await waitFor(() => {
      expect(screen.getByText('Suspect Candidate')).toBeDefined()
    })
  })

  it('renders confirm and dismiss controls for each candidate', async () => {
    render(<Page />)
    await waitFor(() => {
      expect(screen.getByText('Suspect Candidate')).toBeDefined()
    })
    const confirmBtn = screen.getByRole('button', { name: /confirm/i })
    const dismissBtn = screen.getByRole('button', { name: /dismiss/i })
    expect(confirmBtn).toBeDefined()
    expect(dismissBtn).toBeDefined()
  })

  it('calls the triage endpoint with status=evidence when confirm is clicked', async () => {
    const fetchMock = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>(
      (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString()
        if (url.includes('/api/cases') && !url.includes('export') && !url.includes('search') && !url.includes('candidates')) {
          return Promise.resolve(
            new Response(JSON.stringify([mockCase]), { status: 200, headers: { 'content-type': 'application/json' } }),
          )
        }
        if (url.includes('candidates')) {
          return Promise.resolve(
            new Response(JSON.stringify([mockCandidate]), { status: 200, headers: { 'content-type': 'application/json' } }),
          )
        }
        if (url.includes('/api/evidence')) {
          return Promise.resolve(
            new Response(JSON.stringify([]), { status: 200, headers: { 'content-type': 'application/json' } }),
          )
        }
        return Promise.resolve(
          new Response(JSON.stringify({ id: CANDIDATE_ID, status: 'evidence' }), { status: 200, headers: { 'content-type': 'application/json' } }),
        )
      },
    )
    vi.stubGlobal('fetch', fetchMock)

    render(<Page />)
    await waitFor(() => {
      expect(screen.getByText('Suspect Candidate')).toBeDefined()
    })

    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))

    await waitFor(() => {
      const calls = fetchMock.mock.calls
      const triageCall = calls.find((args) => {
        const url = typeof args[0] === 'string' ? args[0] : args[0].toString()
        const body = typeof args[1]?.body === 'string' ? args[1].body : ''
        return url.includes(CANDIDATE_ID) && body.includes('evidence')
      })
      expect(triageCall).toBeDefined()
    })
  })

  it('calls the triage endpoint with status=dismissed when dismiss is clicked', async () => {
    const fetchMock = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>(
      (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString()
        if (url.includes('/api/cases') && !url.includes('export') && !url.includes('search') && !url.includes('candidates')) {
          return Promise.resolve(
            new Response(JSON.stringify([mockCase]), { status: 200, headers: { 'content-type': 'application/json' } }),
          )
        }
        if (url.includes('candidates')) {
          return Promise.resolve(
            new Response(JSON.stringify([mockCandidate]), { status: 200, headers: { 'content-type': 'application/json' } }),
          )
        }
        if (url.includes('/api/evidence')) {
          return Promise.resolve(
            new Response(JSON.stringify([]), { status: 200, headers: { 'content-type': 'application/json' } }),
          )
        }
        return Promise.resolve(
          new Response(JSON.stringify({ id: CANDIDATE_ID, status: 'dismissed' }), { status: 200, headers: { 'content-type': 'application/json' } }),
        )
      },
    )
    vi.stubGlobal('fetch', fetchMock)

    render(<Page />)
    await waitFor(() => {
      expect(screen.getByText('Suspect Candidate')).toBeDefined()
    })

    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }))

    await waitFor(() => {
      const calls = fetchMock.mock.calls
      const triageCall = calls.find((args) => {
        const url = typeof args[0] === 'string' ? args[0] : args[0].toString()
        const body = typeof args[1]?.body === 'string' ? args[1].body : ''
        return url.includes(CANDIDATE_ID) && body.includes('dismissed')
      })
      expect(triageCall).toBeDefined()
    })
  })
})
