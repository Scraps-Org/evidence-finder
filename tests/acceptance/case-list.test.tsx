import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import CaseList from '../../src/components/CaseList';

describe('D2-case-input: Case List Display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays newly saved case in the list', async () => {
    const newCase = { id: '1', terms: 'John Doe', createdAt: new Date() };
    const mockFetch = vi.fn<[string], Promise<Response>>()
      .mockResolvedValueOnce(new Response(JSON.stringify([newCase]), { status: 200 }));
    vi.stubGlobal('fetch', mockFetch);

    render(<CaseList />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('renders empty state when no cases exist', async () => {
    const mockFetch = vi.fn<[string], Promise<Response>>()
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }));
    vi.stubGlobal('fetch', mockFetch);

    render(<CaseList />);

    await waitFor(() => {
      expect(screen.getByText(/no cases|empty/i)).toBeInTheDocument();
    });
  });
});
