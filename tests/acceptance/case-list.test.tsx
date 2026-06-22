import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import CaseList from '../../src/components/CaseList';

describe('Case List - newly saved cases appear', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays newly saved case in the list after creation', async () => {
    const mockFetch = vi.fn<[string | Request, RequestInit?], Promise<Response>>(async () =>
      new Response(
        JSON.stringify([
          { id: '1', identifyingTerms: 'Jane Smith', createdAt: '2026-06-22T10:00:00Z' }
        ]),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    );
    vi.stubGlobal('fetch', mockFetch);

    render(<CaseList />);

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('includes newly created case among multiple cases', async () => {
    const mockFetch = vi.fn<[string | Request, RequestInit?], Promise<Response>>(async () =>
      new Response(
        JSON.stringify([
          { id: '1', identifyingTerms: 'Jane Smith', createdAt: '2026-06-22T10:00:00Z' },
          { id: '2', identifyingTerms: 'John Doe', createdAt: '2026-06-22T11:00:00Z' }
        ]),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    );
    vi.stubGlobal('fetch', mockFetch);

    render(<CaseList />);

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });
});