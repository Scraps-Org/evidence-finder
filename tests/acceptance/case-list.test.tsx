import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Page from '../../src/app/page';

describe('Case List Display (D2-case-input)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays newly saved case in the case list after successful submission', async () => {
    const mockFetch = vi.fn((url) => {
      if (url === '/api/cases' && !url.includes('POST')) {
        return Promise.resolve(
          new Response(
            JSON.stringify([
              { id: '1', searchTerms: 'Alice Johnson' },
              { id: '2', searchTerms: 'Bob Wilson' }
            ]),
            { status: 200, headers: { 'content-type': 'application/json' } }
          )
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({ id: '3', searchTerms: 'Charlie Brown' }),
          { status: 201, headers: { 'content-type': 'application/json' } }
        )
      );
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<Page />);

    await waitFor(() => {
      expect(screen.queryByText('Alice Johnson')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/identifying terms/i);
    const submitButton = screen.getByRole('button', { name: /submit|save|create case/i });

    await userEvent.type(input, 'Charlie Brown');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Charlie Brown')).toBeInTheDocument();
    });

    vi.unstubAllGlobals();
  });
});
