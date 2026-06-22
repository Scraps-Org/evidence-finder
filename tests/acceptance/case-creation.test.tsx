import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import EvidenceFinder from '../../src/components/EvidenceFinder';

describe('D2-case-input: Case Creation Form', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should render the case creation form with identifying terms input field', () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    render(<EvidenceFinder />);
    const input = screen.getByRole('textbox', { name: /identifying terms/i });
    expect(input).toBeInTheDocument();
  });

  it('should accept identifying terms input and submit via API', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: '1', identifyingTerms: 'John Doe' }), {
          status: 201,
          headers: { 'content-type': 'application/json' },
        })
      );
    global.fetch = mockFetch;

    render(<EvidenceFinder />);

    const input = screen.getByRole('textbox', { name: /identifying terms/i });
    const submitButton = screen.getByRole('button', { name: /create case/i });

    await user.type(input, 'John Doe');
    await user.click(submitButton);

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/cases',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'content-type': 'application/json',
        }),
      })
    );
  });

  it('should reject empty input and show validation error', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    render(<EvidenceFinder />);

    const submitButton = screen.getByRole('button', { name: /create case/i });
    await user.click(submitButton);

    const errorMessage = screen.getByText(/required and cannot be empty/i);
    expect(errorMessage).toBeInTheDocument();
  });

  it('should reject whitespace-only input and show validation error', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    render(<EvidenceFinder />);

    const input = screen.getByRole('textbox', { name: /identifying terms/i });
    const submitButton = screen.getByRole('button', { name: /create case/i });

    await user.type(input, '   ');
    await user.click(submitButton);

    const errorMessage = screen.getByText(/required and cannot be empty/i);
    expect(errorMessage).toBeInTheDocument();
  });

  it('should clear input field after successful submission', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: '1', identifyingTerms: 'Jane Smith' }), {
          status: 201,
          headers: { 'content-type': 'application/json' },
        })
      );

    render(<EvidenceFinder />);

    const input = screen.getByRole('textbox', { name: /identifying terms/i }) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /create case/i });

    await user.type(input, 'Jane Smith');
    await user.click(submitButton);

    expect(input.value).toBe('');
  });
});
