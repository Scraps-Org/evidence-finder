import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import EvidenceFinder from '../../src/components/EvidenceFinder';

describe('D2-case-input: Case creation UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('accepts identifying terms and submits them to the API route', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn<[RequestInfo, RequestInit | undefined], Promise<Response>>();
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: '1', terms: 'John Doe' }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', mockFetch);

    render(<EvidenceFinder />);

    const input = screen.getByRole('textbox', { name: /identifying terms|search/i });
    const submitButton = screen.getByRole('button', { name: /submit|create case|save/i });

    await user.type(input, 'John Doe');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/cases', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('John Doe'),
      }));
    });
  });

  it('rejects empty input and does not submit', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn<[RequestInfo, RequestInit | undefined], Promise<Response>>();
    vi.stubGlobal('fetch', mockFetch);

    render(<EvidenceFinder />);

    const submitButton = screen.getByRole('button', { name: /submit|create case|save/i });
    await user.click(submitButton);

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('rejects whitespace-only input and does not submit', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn<[RequestInfo, RequestInit | undefined], Promise<Response>>();
    vi.stubGlobal('fetch', mockFetch);

    render(<EvidenceFinder />);

    const input = screen.getByRole('textbox', { name: /identifying terms|search/i });
    const submitButton = screen.getByRole('button', { name: /submit|create case|save/i });

    await user.type(input, '   ');
    await user.click(submitButton);

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
