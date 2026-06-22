import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import EvidenceFinder from '../../src/components/EvidenceFinder';

describe('Case Creation Form (D2-case-input)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('accepts identifying search terms and submits to API on form submit', async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: '1', terms: 'John Doe' }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      })
    );

    render(<EvidenceFinder />);

    const input = screen.getByRole('textbox', { name: /identifying terms|search terms|case name/i });
    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });

    await userEvent.type(input, 'John Doe');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/cases'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'content-type': 'application/json',
          }),
          body: expect.stringContaining('John Doe'),
        })
      );
    });
  });

  it('rejects empty input and shows validation error', async () => {
    render(<EvidenceFinder />);

    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });
    await userEvent.click(submitButton);

    const errorMsg = await screen.findByText(/required|cannot be empty|must enter/i);
    expect(errorMsg).toBeInTheDocument();
  });

  it('rejects whitespace-only input and shows validation error', async () => {
    render(<EvidenceFinder />);

    const input = screen.getByRole('textbox', { name: /identifying terms|search terms|case name/i });
    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });

    await userEvent.type(input, '   ');
    await userEvent.click(submitButton);

    const errorMsg = await screen.findByText(/required|cannot be empty|must enter/i);
    expect(errorMsg).toBeInTheDocument();
  });
})