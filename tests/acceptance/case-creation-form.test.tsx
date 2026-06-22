import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import CaseCreationForm from '../../src/components/CaseCreationForm';

describe('Case Creation Form [D2-case-input]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('[Criterion 1] should accept identifying terms input and submit to API route', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ id: '1', identifyingTerms: 'John Doe' }), {
        status: 201,
        headers: { 'content-type': 'application/json' }
      })
    );
    vi.stubGlobal('fetch', mockFetch);

    render(<CaseCreationForm />);

    const input = screen.getByRole('textbox', { name: /identifying terms/i });
    const submitButton = screen.getByRole('button', { name: /submit|create/i });

    fireEvent.change(input, { target: { value: 'John Doe' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/cases',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'content-type': 'application/json' }),
          body: JSON.stringify({ identifyingTerms: 'John Doe' })
        })
      );
    });
  });

  it('[Criterion 5a] should reject empty string input with validation error', async () => {
    render(<CaseCreationForm />);

    const input = screen.getByRole('textbox', { name: /identifying terms/i });
    const submitButton = screen.getByRole('button', { name: /submit|create/i });

    fireEvent.change(input, { target: { value: '' } });
    fireEvent.click(submitButton);

    const errorMessage = await screen.findByText(/cannot be empty|required|please enter/i);
    expect(errorMessage).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('[Criterion 5b] should reject whitespace-only input with validation error', async () => {
    render(<CaseCreationForm />);

    const input = screen.getByRole('textbox', { name: /identifying terms/i });
    const submitButton = screen.getByRole('button', { name: /submit|create/i });

    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(submitButton);

    const errorMessage = await screen.findByText(/cannot be empty|required|whitespace/i);
    expect(errorMessage).toBeInTheDocument();
  });

  it('should clear input on successful submission', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ id: '1', identifyingTerms: 'Jane Smith' }), {
        status: 201,
        headers: { 'content-type': 'application/json' }
      })
    );
    vi.stubGlobal('fetch', mockFetch);

    render(<CaseCreationForm />);

    const input = screen.getByRole('textbox', { name: /identifying terms/i }) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /submit|create/i });

    fireEvent.change(input, { target: { value: 'Jane Smith' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });
}
