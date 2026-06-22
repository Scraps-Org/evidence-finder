import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Page from '../../src/app/page';

describe('D2-case-input: Case Creation Form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('accepts identifying terms input and submits to API route', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ id: '1', identifyingTerms: 'John Doe' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      )
    );

    vi.stubGlobal('fetch', mockFetch);

    render(<Page />);

    const input = screen.getByRole('textbox', {
      name: /identifying terms/i,
    }) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /create case/i });

    await user.type(input, 'John Doe');
    await user.click(submitButton);

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

  it('rejects empty input and does not submit', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    render(<Page />);

    const submitButton = screen.getByRole('button', { name: /create case/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  it('rejects whitespace-only input and does not submit', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    render(<Page />);

    const input = screen.getByRole('textbox', {
      name: /identifying terms/i,
    }) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /create case/i });

    await user.type(input, '   ');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
