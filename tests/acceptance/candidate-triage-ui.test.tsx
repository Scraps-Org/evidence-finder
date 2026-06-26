import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// Mock fetch so the UI test is isolated from the real API route
const mockFetch = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>()
vi.stubGlobal('fetch', mockFetch)

// Mock next/navigation used by page components
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({ caseId: 'case-1' }),
  useSearchParams: () => new URLSearchParams(),
}))

// Mock server actions module — the UI calls these; the route test covers the real handler
vi.mock('../../src/lib/candidateActions', () => ({
  confirmCandidate: vi.fn<[string], Promise<void>>().mockResolvedValue(undefined),
  dismissCandidate: vi.fn<[string], Promise<void>>().mockResolvedValue(undefined),
}))

import * as actions from '../../src/lib/candidateActions'
import CaseView from '../../src/components/CaseView'

const CANDIDATES = [
  { id: 'c1', url: 'https://example.com/a', title: 'Alpha result', status: 'pending' },
  { id: 'c2', url: 'https://example.com/b', title: 'Beta result', status: 'pending' },
]

beforeEach(() => {
  vi.clearAllMocks()
  mockFetch.mockResolvedValue(
    new Response(JSON.stringify(CANDIDATES), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  )
})

describe('D8 candidate triage UI', () => {
  it('lists candidates fetched for the case', async () => {
    render(<CaseView caseId="case-1" />)
    await waitFor(() => {
      expect(screen.getByText('Alpha result')).toBeInTheDocument()
      expect(screen.getByText('Beta result')).toBeInTheDocument()
    })
  })

  it('calls confirmCandidate server action when user clicks Confirm', async () => {
    const user = userEvent.setup()
    render(<CaseView caseId="case-1" />)
    await waitFor(() => screen.getAllByRole('listitem').length > 0)
    const items = screen.getAllByRole('listitem')
    await user.click(within(items[0]!).getByRole('button', { name: /confirm/i }))
    expect(actions.confirmCandidate).toHaveBeenCalledWith('c1')
  })

  it('calls dismissCandidate server action when user clicks Dismiss', async () => {
    const user = userEvent.setup()
    render(<CaseView caseId="case-1" />)
    await waitFor(() => screen.getAllByRole('listitem').length > 0)
    const items = screen.getAllByRole('listitem')
    await user.click(within(items[0]!).getByRole('button', { name: /dismiss/i }))
    expect(actions.dismissCandidate).toHaveBeenCalledWith('c1')
  })
})

import { within } from '@testing-library/react'
