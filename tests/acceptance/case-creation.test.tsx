import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import EvidenceFinder from '../../src/components/EvidenceFinder';

describe('D2-case-input: Case Creation Form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('accepts identifying terms and submits to API route on form submit', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: '1', terms: 'John Doe' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<EvidenceFinder />);

    const input = screen.getByRole('textbox', { name: /identifying terms|search|case/i });
    const submitButton = screen.getByRole('button', { name: /submit|create|save|search/i });

    fireEvent.change(input, { target: { value: 'John Doe' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/cases'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'content-type': 'application/json' }),
        })
      );
    });

    const callBody = mockFetch.mock.calls[0]![1]!.body as string;
    expect(JSON.parse(callBody)).toMatchObject({ terms: 'John Doe' });
  });

  it('rejects empty input and does not submit', async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    render(<EvidenceFinder />);

    const input = screen.getByRole('textbox', { name: /identifying terms|search|case/i });
    const submitButton = screen.getByRole('button', { name: /submit|create|save|search/i });

    fireEvent.change(input, { target: { value: '' } });
    fireEvent.click(submitButton);

    expect(mockFetch).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).toBeInTheDocument();
  });

  it('rejects whitespace-only input and does not submit', async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    render(<EvidenceFinder />);

    const input = screen.getByRole('textbox', { name: /identifying terms|search|case/i });
    const submitButton = screen.getByRole('button', { name: /submit|create|save|search/i });

    fireEvent.change(input, { target: { value: '   \t\n  ' } });
    fireEvent.click(submitButton);

    expect(mockFetch).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).toBeInTheDocument();
  });
});
