import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CaseList from '../../src/components/CaseList';

describe('Case List (Newly Saved Cases Display)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays newly saved case in the case list', async () => {
    const mockCases = [
      { id: '1', identifyingTerms: 'John Doe', createdAt: new Date().toISOString() },
    ];

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ cases: mockCases }),
    });

    render(<CaseList />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('updates list when a new case is created', async () => {
    const user = userEvent.setup();
    const initialCases = [{ id: '1', identifyingTerms: 'Jane Smith', createdAt: new Date().toISOString() }];
    const updatedCases = [
      ...initialCases,
      { id: '2', identifyingTerms: 'New Case', createdAt: new Date().toISOString() },
    ];

    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cases: initialCases }) })
      .mockResolvedValueOnce({ ok: true, json: async () => updatedCases });

    const { rerender } = render(<CaseList />);

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    rerender(<CaseList />);

    await waitFor(() => {
      expect(screen.getByText('New Case')).toBeInTheDocument();
    });
  });
});
