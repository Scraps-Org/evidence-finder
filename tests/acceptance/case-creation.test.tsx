import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { vi } from 'vitest';
import { describe, it, expect, beforeEach } from 'vitest';
import EvidenceFinder from '../../src/components/EvidenceFinder';

describe('D2-case-input: Case Creation UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('accepts identifying terms input and submits to API route', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.mocked(global.fetch);

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: '123', identifyingTerms: 'John Doe' }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      })
    );

    render(<EvidenceFinder />);

    const input = screen.getByPlaceholderText(/identifying terms|name|identifier/i) as HTMLInputElement;
    await user.type(input, 'John Doe');

    const submitButton = screen.getByRole('button', { name: /submit|save|create case/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/cases'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('John Doe'),
        })
      );
    });
  });

  it('rejects empty input and does not submit', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.mocked(global.fetch);

    render(<EvidenceFinder />);

    const submitButton = screen.getByRole('button', { name: /submit|save|create case/i });
    await user.click(submitButton);

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('rejects whitespace-only input and does not submit', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.mocked(global.fetch);

    render(<EvidenceFinder />);

    const input = screen.getByPlaceholderText(/identifying terms|name|identifier/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /submit|save|create case/i });

    await user.type(input, '   ');
    await user.click(submitButton);

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('displays validation error message on empty submit', async () => {
    const user = userEvent.setup();
    render(<EvidenceFinder />);

    const submitButton = screen.getByRole('button', { name: /submit|save|create case/i });
    await user.click(submitButton);

    expect(screen.getByText(/identifying terms|required|cannot be empty/i)).toBeInTheDocument();
  });
}
