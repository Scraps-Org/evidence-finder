import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import CaseList from '../../src/components/CaseList';

describe('케이스 목록 표시', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('새로 저장된 케이스가 케이스 목록에 나타난다', async () => {
    const newCase = {
      id: 'case-new-1',
      identifyingTerms: 'New Test Case',
      createdAt: new Date().toISOString(),
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ cases: [newCase] }),
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<CaseList />);

    await waitFor(() => {
      expect(screen.getByText('New Test Case')).toBeInTheDocument();
    });
  });

  it('여러 케이스가 저장된 후 모두 목록에 표시된다', async () => {
    const cases = [
      { id: 'case-1', identifyingTerms: 'Case One', createdAt: new Date().toISOString() },
      { id: 'case-2', identifyingTerms: 'Case Two', createdAt: new Date().toISOString() },
      { id: 'case-3', identifyingTerms: 'Case Three', createdAt: new Date().toISOString() },
    ];

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ cases }),
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<CaseList />);

    await waitFor(() => {
      expect(screen.getByText('Case One')).toBeInTheDocument();
      expect(screen.getByText('Case Two')).toBeInTheDocument();
      expect(screen.getByText('Case Three')).toBeInTheDocument();
    });
  });
});
