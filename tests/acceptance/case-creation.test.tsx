import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import CaseCreation from '../../src/components/CaseCreation';

describe('Case Creation Form (D2-case-input)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('accepts identifying terms input and submits to API route', async () => {
    const user = userEvent.setup();
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1', identifyingTerms: 'John Doe' }),
    });

    render(<CaseCreation />);

    const input = screen.getByRole('textbox', { name: /identifying terms|search terms/i });
    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });

    await user.type(input, 'John Doe');
    await user.click(submitButton);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/cases'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('John Doe'),
        headers: expect.objectContaining({
          'content-type': 'application/json',
        }),
      })
    );
  });

  it('rejects empty input with validation error', async () => {
    const user = userEvent.setup();
    render(<CaseCreation />);

    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });
    await user.click(submitButton);

    expect(screen.queryByText(/required|cannot be empty|must enter/i)).toBeInTheDocument();
  });

  it('rejects whitespace-only input with validation error', async () => {
    const user = userEvent.setup();
    render(<CaseCreation />);

    const input = screen.getByRole('textbox', { name: /identifying terms|search terms/i });
    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });

    await user.type(input, '   ');
    await user.click(submitButton);

    expect(screen.queryByText(/required|cannot be empty|must enter/i)).toBeInTheDocument();
  });

  it('clears form after successful submission', async () => {
    const user = userEvent.setup();
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1', identifyingTerms: 'Jane Smith' }),
    });

    render(<CaseCreation />);

    const input = screen.getByRole('textbox', { name: /identifying terms|search terms/i }) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });

    await user.type(input, 'Jane Smith');
    await user.click(submitButton);

    expect(input.value).toBe('');
  });
});
