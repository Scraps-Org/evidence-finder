import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Page from '../../src/app/page';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Case creation UI', () => {
  it('shows the saved case in the list after successful submission', async () => {
    const term = 'Jane Doe';
    const createdCase = { id: 'abc-123', identifyingTerms: term };

    vi.stubGlobal(
      'fetch',
      vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValueOnce(
        new Response(JSON.stringify(createdCase), {
          status: 201,
          headers: { 'content-type': 'application/json' },
        })
      )
    );

    render(<Page />);

    const input = screen.getByRole('textbox');
    await userEvent.type(input, term);

    const submitBtn = screen.getByRole('button', { name: /submit|create|search|add/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(term)).toBeInTheDocument();
    });
  });

  it('does not call the API when the input is empty', async () => {
    const fetchMock = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>();
    vi.stubGlobal('fetch', fetchMock);

    render(<Page />);

    const submitBtn = screen.getByRole('button', { name: /submit|create|search|add/i });
    await userEvent.click(submitBtn);

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
