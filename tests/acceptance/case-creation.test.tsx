import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import EvidenceFinder from '../../src/components/EvidenceFinder';

vi.stubGlobal('fetch', vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>());

describe('Case Creation Form - D2-case-input', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('accepts identifying terms input and submits to API route', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'case-1', identifyingTerms: 'Jane Doe' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    render(<EvidenceFinder />);

    const input = screen.getByPlaceholderText(/identifying terms|search/i);
    await userEvent.type(input, 'Jane Doe');

    const submitBtn = screen.getByRole('button', { name: /submit|save|create/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/cases/),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'content-type': 'application/json' }),
          body: expect.stringContaining('Jane Doe'),
        })
      );
    });
  });

  it('rejects empty input with validation error', async () => {
    render(<EvidenceFinder />);

    const submitBtn = screen.getByRole('button', { name: /submit|save|create/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.queryByText(/required|cannot be empty|please enter/i)
      ).toBeInTheDocument();
    });
  });

  it('rejects whitespace-only input with validation error', async () => {
    render(<EvidenceFinder />);

    const input = screen.getByPlaceholderText(/identifying terms|search/i);
    await userEvent.type(input, '   ');

    const submitBtn = screen.getByRole('button', { name: /submit|save|create/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.queryByText(/required|cannot be empty|please enter/i)
      ).toBeInTheDocument();
    });
  });
});
