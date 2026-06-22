import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import CaseList from '../../src/components/CaseList';

describe('Case List Display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('D2-case-input: Newly saved case appears in case list', () => {
    it('displays case in the list after creation', async () => {
      const mockCases = [
        { id: '1', searchTerm: 'John Doe', createdAt: new Date().toISOString() },
        { id: '2', searchTerm: 'Jane Smith', createdAt: new Date().toISOString() },
      ];

      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockCases,
      });
      vi.stubGlobal('fetch', mockFetch);

      render(<CaseList />);

      const case1 = await screen.findByText('John Doe');
      const case2 = await screen.findByText('Jane Smith');

      expect(case1).toBeInTheDocument();
      expect(case2).toBeInTheDocument();
    });

    it('displays empty state when no cases exist', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });
      vi.stubGlobal('fetch', mockFetch);

      render(<CaseList />);

      expect(screen.getByText(/no cases found/i)).toBeInTheDocument();
    });
  });
});
