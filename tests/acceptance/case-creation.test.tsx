import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import EvidenceFinder from '../../src/components/EvidenceFinder';

describe('D2-case-input: Case creation form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ id: '1', identifyingTerms: 'test case' }), {
          status: 201,
          headers: { 'content-type': 'application/json' },
        })
      )
    ));
  });

  it('accepts identifying terms input and submits to API route', async () => {
    render(<EvidenceFinder />);

    const input = screen.getByRole('textbox', { name: /identifying terms|search|case/i });
    expect(input).toBeInTheDocument();

    await userEvent.type(input, 'John Doe');
    expect(input).toHaveValue('John Doe');

    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(vi.mocked(global.fetch)).toHaveBeenCalledWith(
        expect.stringContaining('/api/cases'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('John Doe'),
        })
      );
    });
  });

  it('rejects empty input and does not submit', async () => {
    render(<EvidenceFinder />);

    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });
    await userEvent.click(submitButton);

    expect(vi.mocked(global.fetch)).not.toHaveBeenCalled();
  });

  it('rejects whitespace-only input and does not submit', async () => {
    render(<EvidenceFinder />);

    const input = screen.getByRole('textbox', { name: /identifying terms|search|case/i });
    await userEvent.type(input, '   ');

    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });
    await userEvent.click(submitButton);

    expect(vi.mocked(global.fetch)).not.toHaveBeenCalled();
  });
});
