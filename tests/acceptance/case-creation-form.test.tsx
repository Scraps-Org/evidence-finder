import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import CaseCreationForm from '../../src/components/CaseCreationForm';

describe('CaseCreationForm - Case Input and Submission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders form with input field for identifying terms', () => {
    render(<CaseCreationForm />);
    const input = screen.getByLabelText(/identifying terms/i) as HTMLInputElement;
    expect(input).toBeInTheDocument();
  });

  it('accepts identifying terms input and submits to API', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: '1', identifyingTerms: 'John Doe' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<CaseCreationForm />);
    const input = screen.getByLabelText(/identifying terms/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /submit|create/i });

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

  it('rejects empty identifying terms input', async () => {
    render(<CaseCreationForm />);
    const input = screen.getByLabelText(/identifying terms/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /submit|create/i });

    fireEvent.change(input, { target: { value: '' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/required|cannot be empty|whitespace/i)).toBeInTheDocument();
    });
  });

  it('rejects whitespace-only identifying terms input', async () => {
    render(<CaseCreationForm />);
    const input = screen.getByLabelText(/identifying terms/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /submit|create/i });

    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/required|cannot be empty|whitespace/i)).toBeInTheDocument();
    });
  });
}
