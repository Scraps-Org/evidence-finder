import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import Page from '../../src/app/page';

describe('D2-case-input: Case Creation Form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn<[string, RequestInit?], Promise<Response>>());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should accept identifying terms and submit to API route', async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: '1', terms: 'John Doe' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    render(<Page />);

    const input = screen.getByRole('textbox', { name: /identifying terms|search terms|case/i });
    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });

    await userEvent.type(input, 'John Doe');
    await userEvent.click(submitButton);

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

  it('should reject empty input and not submit', async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockClear();

    render(<Page />);

    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });
    await userEvent.click(submitButton);

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should reject whitespace-only input and not submit', async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockClear();

    render(<Page />);

    const input = screen.getByRole('textbox', { name: /identifying terms|search terms|case/i });
    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });

    await userEvent.type(input, '   ');
    await userEvent.click(submitButton);

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should display validation error for empty input', async () => {
    render(<Page />);

    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });
    await userEvent.click(submitButton);

    const errorMsg = screen.getByText(/required|cannot be empty|must enter/i);
    expect(errorMsg).toBeInTheDocument();
  });
});
