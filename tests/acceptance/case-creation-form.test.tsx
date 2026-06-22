import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import CaseCreationForm from '../../src/components/CaseCreationForm';

describe('CaseCreationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render a form with input field and submit button', () => {
    render(<CaseCreationForm />);
    expect(screen.getByLabelText(/identifying terms/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create case/i })).toBeInTheDocument();
  });

  it('should accept identifying terms input and submit to API', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ id: '1', identifyingTerms: 'test case' }), {
          status: 201,
          headers: { 'content-type': 'application/json' },
        })
      )
    );
    global.fetch = mockFetch;

    render(<CaseCreationForm />);
    const input = screen.getByLabelText(/identifying terms/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /create case/i });

    await user.type(input, 'John Doe');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/cases'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: expect.stringContaining('John Doe'),
        })
      );
    });
  });

  it('should reject empty input on form level', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    render(<CaseCreationForm />);
    const submitButton = screen.getByRole('button', { name: /create case/i });

    await user.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  it('should reject whitespace-only input on form level', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    render(<CaseCreationForm />);
    const input = screen.getByLabelText(/identifying terms/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /create case/i });

    await user.type(input, '   ');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
}
