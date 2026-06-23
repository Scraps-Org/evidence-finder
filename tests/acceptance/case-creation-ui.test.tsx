import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Page from '../../src/app/page';

describe('Case creation UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits identifying terms to the API route and displays the saved case in the list', async () => {
    const mockCases = [{ id: '1', identifyingTerms: 'John Doe' }];

    vi.stubGlobal(
      'fetch',
      vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>((url, opts) => {
        if (opts?.method === 'POST') {
          return Promise.resolve(
            new Response(JSON.stringify({ id: '1', identifyingTerms: 'John Doe' }), {
              status: 201,
              headers: { 'content-type': 'application/json' },
            })
          );
        }
        return Promise.resolve(
          new Response(JSON.stringify(mockCases), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          })
        );
      })
    );

    render(<Page />);

    const input = screen.getByRole('textbox', { name: /identifying terms/i });
    const submitButton = screen.getByRole('button', { name: /create case/i });

    fireEvent.change(input, { target: { value: 'John Doe' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const fetchMock = vi.mocked(fetch);
    const postCall = fetchMock.mock.calls.find(
      (call) => (call[1] as RequestInit | undefined)?.method === 'POST'
    );
    expect(postCall).toBeDefined();
    const body = JSON.parse((postCall![1] as RequestInit).body as string) as { identifyingTerms: string };
    expect(body.identifyingTerms).toBe('John Doe');
  });
});
