import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import CaseCreation from '../../src/components/CaseCreation';

describe('D2-case-input: Case creation form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('accepts identifying terms and submits to API', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ id: '1', identifyingTerms: 'John Doe' }), { status: 201 }))
    );
    vi.stubGlobal('fetch', mockFetch);

    render(<CaseCreation />);

    const input = screen.getByPlaceholderText(/identifying terms|name|identifier/i);
    await user.type(input, 'John Doe');

    const submitButton = screen.getByRole('button', { name: /submit|save|create/i });
    await user.click(submitButton);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/cases'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'content-type': 'application/json' }),
        body: expect.stringContaining('John Doe'),
      })
    );
  });

  it('rejects empty input and shows validation error', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    render(<CaseCreation />);

    const submitButton = screen.getByRole('button', { name: /submit|save|create/i });
    await user.click(submitButton);

    expect(screen.getByText(/cannot be empty|required|please enter/i)).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('rejects whitespace-only input and shows validation error', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    render(<CaseCreation />);

    const input = screen.getByPlaceholderText(/identifying terms|name|identifier/i);
    await user.type(input, '   ');

    const submitButton = screen.getByRole('button', { name: /submit|save|create/i });
    await user.click(submitButton);

    expect(screen.getByText(/cannot be empty|required|please enter/i)).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
