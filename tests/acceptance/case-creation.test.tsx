import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import CaseCreationForm from '../../src/components/CaseCreationForm';

describe('D2-case-input: Case creation form UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('accepts identifying terms input and submits to API', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: '1', identifyingTerms: 'John Doe' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<CaseCreationForm />);

    const input = screen.getByRole('textbox', { name: /identifying terms|name/i });
    const submitButton = screen.getByRole('button', { name: /submit|create/i });

    await userEvent.type(input, 'John Doe');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/cases'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('John Doe'),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  it('displays validation error for empty input on submit', async () => {
    render(<CaseCreationForm />);

    const submitButton = screen.getByRole('button', { name: /submit|create/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/required|cannot be empty|whitespace/i)).toBeInTheDocument();
    });
  });

  it('displays validation error for whitespace-only input', async () => {
    render(<CaseCreationForm />);

    const input = screen.getByRole('textbox', { name: /identifying terms|name/i });
    const submitButton = screen.getByRole('button', { name: /submit|create/i });

    await userEvent.type(input, '   ');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/required|cannot be empty|whitespace/i)).toBeInTheDocument();
    });
  });

  it('clears form after successful submission', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: '1', identifyingTerms: 'Jane Smith' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<CaseCreationForm />);

    const input = screen.getByRole('textbox', { name: /identifying terms|name/i }) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /submit|create/i });

    await userEvent.type(input, 'Jane Smith');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });
});
