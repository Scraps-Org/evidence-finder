import { render, screen, waitFor } from '@testing-library/react';
import { vi, beforeEach } from 'vitest';
import CaseList from '../../src/components/CaseList';

describe('Case List — D2-case-input', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays saved case with identifying terms after creation', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([
        { id: '1', identifyingTerms: 'Jane Smith', createdAt: new Date().toISOString() },
      ]),
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<CaseList />);

    await waitFor(() => {
      expect(screen.getByText(/Jane Smith/)).toBeInTheDocument();
    });
  });

  it('renders multiple cases with their identifying terms', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([
        { id: '1', identifyingTerms: 'Alice Johnson', createdAt: new Date().toISOString() },
        { id: '2', identifyingTerms: 'Bob Wilson', createdAt: new Date().toISOString() },
      ]),
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<CaseList />);

    await waitFor(() => {
      expect(screen.getByText(/Alice Johnson/)).toBeInTheDocument();
      expect(screen.getByText(/Bob Wilson/)).toBeInTheDocument();
    });
  });
});
