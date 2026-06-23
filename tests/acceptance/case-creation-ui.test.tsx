import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Page from '../../src/app/page';

describe('Case creation UI', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
        new Response(JSON.stringify({ id: 1, identifyingTerms: 'Alice Smith' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
  });

  it('submits identifying terms to the API route and shows the saved case in the list', async () => {
    render(<Page />);

    const input = screen.getByRole('textbox', { name: /identifying terms/i });
    fireEvent.change(input, { target: { value: 'Alice Smith' } });

    const submitButton = screen.getByRole('button', { name: /create case/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        '/api/cases',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ identifyingTerms: 'Alice Smith' }),
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });
  });
});
