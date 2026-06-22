import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Page from '../../src/app/page';

describe('Case Creation Form - UI Submission (D2-case-input)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('form accepts identifying terms and sends to API route on submit', async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({ id: '1', searchTerms: 'John Doe' }),
          { status: 201, headers: { 'content-type': 'application/json' } }
        )
      )
    );
    vi.stubGlobal('fetch', mockFetch);

    render(<Page />);

    const input = screen.getByPlaceholderText(/identifying terms/i);
    const submitButton = screen.getByRole('button', { name: /submit|save|create case/i });

    await userEvent.type(input, 'John Doe');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/cases',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'content-type': 'application/json' }),
          body: JSON.stringify({ searchTerms: 'John Doe' })
        })
      );
    });

    vi.unstubAllGlobals();
  });

  it('rejects empty input and does not submit', async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    render(<Page />);

    const submitButton = screen.getByRole('button', { name: /submit|save|create case/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).not.toHaveBeenCalled();
    }, { timeout: 1000 });

    vi.unstubAllGlobals();
  });

  it('rejects whitespace-only input and does not submit', async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    render(<Page />);

    const input = screen.getByPlaceholderText(/identifying terms/i);
    const submitButton = screen.getByRole('button', { name: /submit|save|create case/i });

    await userEvent.type(input, '   ');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).not.toHaveBeenCalled();
    }, { timeout: 1000 });

    vi.unstubAllGlobals();
  });
});
