/**
 * UI layer: case view lists candidates; confirm/dismiss buttons call the triage action.
 * fetch is stubbed so only the view layer is exercised here.
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// The coder will implement this component at src/components/CaseView.tsx
import { CaseView } from '../../src/components/CaseView';

const CASE_ID = 'case-ui-test-001';

const mockCandidates = [
  {
    id: 'cand-1',
    caseId: CASE_ID,
    url: 'https://example.com/article1',
    title: 'Candidate Article One',
    snippet: 'Snippet one',
    status: 'detected',
  },
  {
    id: 'cand-2',
    caseId: CASE_ID,
    url: 'https://example.com/article2',
    title: 'Candidate Article Two',
    snippet: 'Snippet two',
    status: 'detected',
  },
];

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
      new Response(JSON.stringify(mockCandidates), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  );
});

describe('CaseView — candidate triage UI', () => {
  it('lists all detected candidates fetched for the case', async () => {
    render(<CaseView caseId={CASE_ID} />);
    await waitFor(() => {
      expect(screen.getByText('Candidate Article One')).toBeDefined();
      expect(screen.getByText('Candidate Article Two')).toBeDefined();
    });
  });

  it('renders a confirm button for each candidate', async () => {
    render(<CaseView caseId={CASE_ID} />);
    await waitFor(() => {
      const confirmButtons = screen.getAllByRole('button', { name: /confirm/i });
      expect(confirmButtons.length).toBe(2);
    });
  });

  it('renders a dismiss button for each candidate', async () => {
    render(<CaseView caseId={CASE_ID} />);
    await waitFor(() => {
      const dismissButtons = screen.getAllByRole('button', { name: /dismiss/i });
      expect(dismissButtons.length).toBe(2);
    });
  });

  it('calls the triage endpoint with status=evidence when confirm is clicked', async () => {
    const fetchMock = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
      new Response(JSON.stringify(mockCandidates), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<CaseView caseId={CASE_ID} />);
    const confirmButtons = await screen.findAllByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButtons[0]!);

    await waitFor(() => {
      const calls = fetchMock.mock.calls;
      const triageCall = calls.find((args) => {
        const url = String(args[0]);
        const body = args[1]?.body ? String(args[1].body) : '';
        return url.includes('cand-1') && body.includes('evidence');
      });
      expect(triageCall).toBeDefined();
    });
  });

  it('calls the triage endpoint with status=dismissed when dismiss is clicked', async () => {
    const fetchMock = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
      new Response(JSON.stringify(mockCandidates), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<CaseView caseId={CASE_ID} />);
    const dismissButtons = await screen.findAllByRole('button', { name: /dismiss/i });
    fireEvent.click(dismissButtons[0]!);

    await waitFor(() => {
      const calls = fetchMock.mock.calls;
      const triageCall = calls.find((args) => {
        const url = String(args[0]);
        const body = args[1]?.body ? String(args[1].body) : '';
        return url.includes('cand-1') && body.includes('dismissed');
      });
      expect(triageCall).toBeDefined();
    });
  });
});
