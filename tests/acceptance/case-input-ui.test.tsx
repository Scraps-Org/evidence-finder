import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EvidenceFinder from '../../src/components/EvidenceFinder';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('EvidenceFinder Case Input', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('submits terms and displays the new case in the list', async () => {
    const mockCreatedCase = { id: '123', terms: 'Jane Doe' };
    const mockList = [mockCreatedCase];

    mockFetch
      .mockResolvedValueOnce({ 
        ok: true, 
        status: 201, 
        json: async () => mockCreatedCase 
      })
      .mockResolvedValueOnce({ 
        ok: true, 
        status: 200, 
        json: async () => mockList 
      });

    render(<EvidenceFinder />);

    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button', { name: /save/i });

    fireEvent.change(input, { target: { value: 'Jane Doe' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/cases', expect.objectContaining({ method: 'POST' }));
  });

  it('does not submit when input is whitespace only', async () => {
    render(<EvidenceFinder />);

    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button', { name: /save/i });

    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(button);

    expect(mockFetch).not.toHaveBeenCalled();
  });
});