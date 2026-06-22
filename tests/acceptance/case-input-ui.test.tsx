import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EvidenceFinder from '../../src/components/EvidenceFinder';

describe('Case Input UI', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('submits identifying terms and displays the created case in the list', async () => {
    const mockCase = { id: '1', terms: 'John Doe' };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCase,
    } as Response);

    render(<EvidenceFinder />);

    const input = screen.getByRole('textbox');
    const submitBtn = screen.getByRole('button', { name: /save case/i });

    fireEvent.change(input, { target: { value: 'John Doe' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith(
      '/api/cases',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ terms: 'John Doe' }),
      }),
    );
  });

  it('does not submit when input is empty or whitespace', async () => {
    render(<EvidenceFinder />);

    const input = screen.getByRole('textbox');
    const submitBtn = screen.getByRole('button', { name: /save case/i });

    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(submitBtn);

    expect(fetch).not.toHaveBeenCalled();
  });
});
