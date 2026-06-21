import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Page from '../../src/app/page';

// Mock global fetch for the API route interaction
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('Case Input Acceptance', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('allows a user to enter identifying terms, persists them, and displays them in the list', async () => {
    const testCaseName = 'John Doe Case 123';
    
    // Mock API response for saving and then fetching the list
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: '1', name: testCaseName }],
      });

    render(<Page />);

    const input = screen.getByRole('textbox');
    const submitButton = screen.getByRole('button', { name: /save|submit/i });

    // Act: Enter valid text and submit
    fireEvent.change(input, { target: { value: testCaseName } });
    fireEvent.click(submitButton);

    // Assert: The input was sent to the API
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining(testCaseName),
        })
      );
    });

    // Assert: The saved case is rendered in the list
    await waitFor(() => {
      expect(screen.getByText(testCaseName)).toBeInTheDocument();
    });
  });

  it('rejects empty or whitespace-only input and does not call the API', async () => {
    render(<Page />);

    const input = screen.getByRole('textbox');
    const submitButton = screen.getByRole('button', { name: /save|submit/i });

    // Act: Enter whitespace and submit
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(submitButton);

    // Assert: API was never called
    expect(mockFetch).not.toHaveBeenCalled();
  });
});