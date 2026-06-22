import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CaseCreationForm from '../../src/components/CaseCreationForm';

describe('Case Creation Form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('accepts identifying terms input and submits to API route', async () => {
    const mockFetch = vi.fn<[string | Request, RequestInit?], Promise<Response>>(
      async () =>
        new Response(
          JSON.stringify({ id: '1', identifyingTerms: 'John Doe', createdAt: new Date() }),
          { status: 201, headers: { 'content-type': 'application/json' } }
        )
    );
    vi.stubGlobal('fetch', mockFetch);

    render(<CaseCreationForm />);

    const input = screen.getByRole('textbox', { name: /identifying terms|case input/i });
    const submitButton = screen.getByRole('button', { name: /submit|create case/i });

    await userEvent.type(input, 'Jane Smith');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/cases', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'content-type': 'application/json' }),
        body: JSON.stringify({ identifyingTerms: 'Jane Smith' })
      }));
    });
  });

  it('rejects empty input and does not submit', async () => {
    const mockFetch = vi.fn<[string | Request, RequestInit?], Promise<Response>>();
    vi.stubGlobal('fetch', mockFetch);

    render(<CaseCreationForm />);

    const submitButton = screen.getByRole('button', { name: /submit|create case/i });
    await userEvent.click(submitButton);

    expect(screen.getByText(/required|cannot be empty/i)).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('rejects whitespace-only input and does not submit', async () => {
    const mockFetch = vi.fn<[string | Request, RequestInit?], Promise<Response>>();
    vi.stubGlobal('fetch', mockFetch);

    render(<CaseCreationForm />);

    const input = screen.getByRole('textbox', { name: /identifying terms|case input/i });
    const submitButton = screen.getByRole('button', { name: /submit|create case/i });

    await userEvent.type(input, '   ');
    await userEvent.click(submitButton);

    expect(screen.getByText(/required|cannot be empty/i)).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});