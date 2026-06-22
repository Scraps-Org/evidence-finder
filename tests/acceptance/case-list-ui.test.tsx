import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import CaseListPage from '../../src/app/cases/page';

describe('Case List UI - Read Back Saved Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('displays case that was saved via API', async () => {
    const mockCases = [
      { id: '1', identifyingTerms: 'John Doe', createdAt: new Date().toISOString() },
      { id: '2', identifyingTerms: 'Jane Smith', createdAt: new Date().toISOString() },
    ];

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockCases,
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<CaseListPage />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('shows empty state when no cases exist', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<CaseListPage />);

    await waitFor(() => {
      expect(screen.getByText(/no cases found/i)).toBeInTheDocument();
    });
  });
});
