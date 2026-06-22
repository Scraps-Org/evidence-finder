import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import CaseList from '../../src/components/CaseList';

describe('Case List Display [D2-case-input]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('[Criterion 4] should display newly saved case in the list', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          { id: '1', identifyingTerms: 'John Doe', createdAt: new Date().toISOString() }
        ]),
        {
          status: 200,
          headers: { 'content-type': 'application/json' }
        }
      )
    );
    vi.stubGlobal('fetch', mockFetch);

    render(<CaseList />);

    await waitFor(() => {
      const caseItem = screen.getByText(/John Doe/i);
      expect(caseItem).toBeInTheDocument();
    });
  });

  it('should display multiple cases in the list', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          { id: '1', identifyingTerms: 'John Doe', createdAt: new Date().toISOString() },
          { id: '2', identifyingTerms: 'Jane Smith', createdAt: new Date().toISOString() }
        ]),
        {
          status: 200,
          headers: { 'content-type': 'application/json' }
        }
      )
    );
    vi.stubGlobal('fetch', mockFetch);

    render(<CaseList />);

    await waitFor(() => {
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
      expect(screen.getByText(/Jane Smith/i)).toBeInTheDocument();
    });
  });

  it('should handle empty case list gracefully', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    );
    vi.stubGlobal('fetch', mockFetch);

    render(<CaseList />);

    await waitFor(() => {
      const emptyMessage = screen.queryByText(/no cases|empty/i);
      expect(emptyMessage).toBeInTheDocument();
    });
  });
}
