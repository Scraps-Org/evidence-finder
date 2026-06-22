import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import CaseList from '../../src/components/CaseList';

describe('Case List: Display newly created cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('displays newly saved case in the list', async () => {
    const mockCases = [
      { id: '1', identifyingTerms: 'John Doe', createdAt: new Date() },
      { id: '2', identifyingTerms: 'Jane Smith', createdAt: new Date() },
    ];

    const mockFetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify(mockCases), { status: 200 }))
    );
    vi.stubGlobal('fetch', mockFetch);

    render(<CaseList />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('updates list when new case is added', async () => {
    const initialCases = [
      { id: '1', identifyingTerms: 'John Doe', createdAt: new Date() },
    ];

    let callCount = 0;
    const mockFetch = vi.fn(() => {
      callCount++;
      const cases = callCount === 1 ? initialCases : [
        ...initialCases,
        { id: '2', identifyingTerms: 'Jane Smith', createdAt: new Date() },
      ];
      return Promise.resolve(new Response(JSON.stringify(cases), { status: 200 }));
    });
    vi.stubGlobal('fetch', mockFetch);

    const { rerender } = render(<CaseList />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    rerender(<CaseList />);

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });
});
