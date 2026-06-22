import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Page from '../../src/app/page';

describe('D2-case-input: Case Creation Form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('accepts identifying terms input and submits to API route', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'case-1', searchTerm: 'John Doe' }),
    } as Response);

    render(await Page());

    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();

    await user.type(input, 'John Doe');

    const submitButton = screen.getByRole('button', { name: /create|submit|save/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/cases'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'content-type': 'application/json' }),
          body: expect.stringContaining('John Doe'),
        })
      );
    });
  });

  it('rejects empty input and does not submit', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    render(await Page());

    const submitButton = screen.getByRole('button', { name: /create|submit|save/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  it('rejects whitespace-only input and does not submit', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    render(await Page());

    const input = screen.getByRole('textbox');
    await user.type(input, '   ');

    const submitButton = screen.getByRole('button', { name: /create|submit|save/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
