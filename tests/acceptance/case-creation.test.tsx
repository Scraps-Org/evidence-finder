import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import EvidenceFinder from '../../src/components/EvidenceFinder';

describe('Case Creation Form (D2-case-input)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should accept identifying terms in the form input field', async () => {
    const user = userEvent.setup();
    render(<EvidenceFinder />);

    const input = screen.getByRole('textbox', { name: /identifying term|search term|case/i });
    expect(input).toBeInTheDocument();

    await user.type(input, 'John Doe');
    expect(input).toHaveValue('John Doe');
  });

  it('should submit identifying terms to the API route on form submit', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ id: '1', term: 'John Doe' }), {
          status: 201,
          headers: { 'content-type': 'application/json' },
        })
      )
    );
    vi.stubGlobal('fetch', mockFetch);

    render(<EvidenceFinder />);

    const input = screen.getByRole('textbox', { name: /identifying term|search term|case/i });
    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });

    await user.type(input, 'Jane Smith');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/cases'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'content-type': 'application/json' }),
          body: expect.stringContaining('Jane Smith'),
        })
      );
    });
  });

  it('should reject empty input and show validation error', async () => {
    const user = userEvent.setup();
    render(<EvidenceFinder />);

    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });
    await user.click(submitButton);

    const errorMsg = screen.queryByText(/required|cannot be empty|please enter/i);
    expect(errorMsg).toBeInTheDocument();
  });

  it('should reject whitespace-only input and show validation error', async () => {
    const user = userEvent.setup();
    render(<EvidenceFinder />);

    const input = screen.getByRole('textbox', { name: /identifying term|search term|case/i });
    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });

    await user.type(input, '   ');
    await user.click(submitButton);

    const errorMsg = screen.queryByText(/required|cannot be empty|please enter|whitespace/i);
    expect(errorMsg).toBeInTheDocument();
  });
});
