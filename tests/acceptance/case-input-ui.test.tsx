import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EvidenceFinder } from '../../src/components/EvidenceFinder';

describe('Case Input UI', () => {
  it('allows a user to enter identifying terms and see them in the list after submission', async () => {
    const mockCase = { id: '1', identifier: 'John Doe' };
    
    // Mock fetch to simulate the API route response
    vi.stubGlobal('fetch', vi.fn((url, options) => {
      if (options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCase),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([mockCase]),
      });
    }));

    render(<EvidenceFinder />);

    const input = screen.getByRole('textbox');
    const submitButton = screen.getByRole('button', { name: /save|submit/i });

    fireEvent.change(input, { target: { value: 'John Doe' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    vi.unstubAllGlobals();
  });

  it('does not submit when input is empty or whitespace', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    
    render(<EvidenceFinder />);

    const input = screen.getByRole('textbox');
    const submitButton = screen.getByRole('button', { name: /save|submit/i });

    // Test empty
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.click(submitButton);

    // Test whitespace
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(submitButton);

    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});