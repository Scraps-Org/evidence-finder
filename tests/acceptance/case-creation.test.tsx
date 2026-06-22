import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import CaseCreationForm from '../../src/components/CaseCreationForm';

describe('D2-case-input: Case Creation Form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('accepts identifying terms input and submits to API', async () => {
    const mockFetch = vi.fn<[string, RequestInit?], Promise<Response>>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: '1', terms: 'John Doe' }), { status: 200 }));
    vi.stubGlobal('fetch', mockFetch);

    render(<CaseCreationForm />);

    const input = screen.getByRole('textbox', { name: /identifying terms/i });
    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });

    await userEvent.type(input, 'John Doe');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/cases'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'content-type': 'application/json' }),
          body: expect.stringContaining('John Doe')
        })
      );
    });
  });

  it('rejects empty input and does not submit', async () => {
    const mockFetch = vi.fn<[string, RequestInit?], Promise<Response>>();
    vi.stubGlobal('fetch', mockFetch);

    render(<CaseCreationForm />);

    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });
    await userEvent.click(submitButton);

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('rejects whitespace-only input and does not submit', async () => {
    const mockFetch = vi.fn<[string, RequestInit?], Promise<Response>>();
    vi.stubGlobal('fetch', mockFetch);

    render(<CaseCreationForm />);

    const input = screen.getByRole('textbox', { name: /identifying terms/i });
    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });

    await userEvent.type(input, '   ');
    await userEvent.click(submitButton);

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('displays validation error for empty input', async () => {
    render(<CaseCreationForm />);

    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });
    await userEvent.click(submitButton);

    expect(screen.getByText(/required|cannot be empty|must provide/i)).toBeInTheDocument();
  });
});
