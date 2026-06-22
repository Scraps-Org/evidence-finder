import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import EvidenceFinder from '../../src/components/EvidenceFinder';

describe('D2-case-input: Case creation form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('accepts identifying terms input and sends to API on submit', async () => {
    const mockFetch = vi.fn<[string, RequestInit], Promise<Response>>()
      .mockResolvedValue(
        new Response(JSON.stringify({ id: 'case-1', searchTerms: 'John Doe' }), {
          status: 201,
          headers: { 'content-type': 'application/json' },
        })
      );
    vi.stubGlobal('fetch', mockFetch);

    render(<EvidenceFinder />);

    const input = screen.getByRole('textbox', { name: /search terms|identifying|name|identifier/i });
    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });

    fireEvent.change(input, { target: { value: 'John Doe' } });
    fireEvent.click(submitButton);

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
    const mockFetch = vi.fn<[string, RequestInit], Promise<Response>>();
    vi.stubGlobal('fetch', mockFetch);

    render(<EvidenceFinder />);

    const input = screen.getByRole('textbox', { name: /search terms|identifying|name|identifier/i });
    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });

    fireEvent.change(input, { target: { value: '' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).not.toHaveBeenCalled();
    });
    expect(screen.queryByRole('alert')).toBeInTheDocument();
  });

  it('rejects whitespace-only input and does not submit', async () => {
    const mockFetch = vi.fn<[string, RequestInit], Promise<Response>>();
    vi.stubGlobal('fetch', mockFetch);

    render(<EvidenceFinder />);

    const input = screen.getByRole('textbox', { name: /search terms|identifying|name|identifier/i });
    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });

    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
