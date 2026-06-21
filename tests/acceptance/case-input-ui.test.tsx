import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EvidenceFinder } from '../../src/components/EvidenceFinder';

describe('Case Input UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('allows user to enter identifying terms and displays the saved case', async () => {
    const mockCase = { id: '1', terms: 'John Doe' };
    
    // Mock the API response for saving and listing
    (fetch as any) = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCase,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [mockCase],
      });

    render(<EvidenceFinder />);

    const input = screen.getByRole('textbox');
    const submitBtn = screen.getByRole('button', { name: /save/i });

    fireEvent.change(input, { target: { value: 'John Doe' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    expect(fetch).toHaveBeenCalledWith('/api/cases', expect.any(Object));
  });

  it('does not submit when input is empty or whitespace', async () => {
    render(<EvidenceFinder />);

    const input = screen.getByRole('textbox');
    const submitBtn = screen.getByRole('button', { name: /save/i });

    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(fetch).not.toHaveBeenCalledWith('/api/cases', expect.objectContaining({ method: 'POST' }));
    });
  });
});