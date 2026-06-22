import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import CaseList from '../../src/components/CaseList';

describe('Case List Display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays newly saved case in the list', async () => {
    const mockCases = [
      { id: '1', searchTerms: 'John Doe', createdAt: new Date() },
      { id: '2', searchTerms: 'Jane Smith', createdAt: new Date() },
    ];

    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ cases: mockCases }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', mockFetch);

    render(<CaseList />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });
});
