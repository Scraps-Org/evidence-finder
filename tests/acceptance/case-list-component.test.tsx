import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import CaseList from '../../src/components/CaseList';

describe('CaseList component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays list of cases fetched from API', async () => {
    const mockCases = [
      { id: '1', identifyingTerms: 'John Doe' },
      { id: '2', identifyingTerms: 'Jane Smith' },
    ];

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockCases,
    }));

    render(<CaseList />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('updates list when new case is added', async () => {
    const initialCases = [{ id: '1', identifyingTerms: 'Existing Case' }];
    const updatedCases = [
      { id: '1', identifyingTerms: 'Existing Case' },
      { id: '2', identifyingTerms: 'New Case' },
    ];

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => initialCases,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => updatedCases,
      });

    vi.stubGlobal('fetch', fetchMock);

    const { rerender } = render(<CaseList refreshTrigger={0} />);

    await waitFor(() => {
      expect(screen.getByText('Existing Case')).toBeInTheDocument();
    });

    rerender(<CaseList refreshTrigger={1} />);

    await waitFor(() => {
      expect(screen.getByText('New Case')).toBeInTheDocument();
    });
  });
});
