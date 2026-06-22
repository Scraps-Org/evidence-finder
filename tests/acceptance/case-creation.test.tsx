import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import CaseForm from '../../src/components/CaseForm';

describe('Case Creation Form (D2-case-input)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('accepts identifying terms input and submits to API route', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: '1', searchTerms: 'John Doe' }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', mockFetch);

    render(<CaseForm onCaseCreated={vi.fn()} />);

    const input = screen.getByRole('textbox', { name: /search terms|identifying terms/i });
    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });

    fireEvent.change(input, { target: { value: 'John Doe' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/cases',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ searchTerms: 'John Doe' }),
        })
      );
    });
  });

  it('rejects empty input and displays validation error', async () => {
    render(<CaseForm onCaseCreated={vi.fn()} />);

    const input = screen.getByRole('textbox', { name: /search terms|identifying terms/i });
    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });

    fireEvent.change(input, { target: { value: '' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/required|cannot be empty|please enter/i)).toBeInTheDocument();
    });
  });

  it('rejects whitespace-only input and displays validation error', async () => {
    render(<CaseForm onCaseCreated={vi.fn()} />);

    const input = screen.getByRole('textbox', { name: /search terms|identifying terms/i });
    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });

    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/required|cannot be empty|please enter/i)).toBeInTheDocument();
    });
  });
});
