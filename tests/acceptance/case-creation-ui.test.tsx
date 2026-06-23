import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Page from '../../src/app/page';

describe('Case creation UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits non-empty identifying terms to the API route via POST', async () => {
    const fetchSpy = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
      new Response(JSON.stringify({ id: 1, identifyingTerms: 'Alice Smith' }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchSpy);

    render(<Page />);

    const input = screen.getByRole('textbox', { name: /identifying terms/i });
    fireEvent.change(input, { target: { value: 'Alice Smith' } });
    fireEvent.click(screen.getByRole('button', { name: /create case/i }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/cases'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Alice Smith'),
        })
      );
    });
  });

  it('displays the saved case in the list after creation', async () => {
    let callCount = 0;
    const fetchSpy = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // Initial GET for case list
        return Promise.resolve(
          new Response(JSON.stringify([]), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          })
        );
      }
      if (callCount === 2) {
        // POST to create
        return Promise.resolve(
          new Response(JSON.stringify({ id: 1, identifyingTerms: 'Bob Jones' }), {
            status: 201,
            headers: { 'content-type': 'application/json' },
          })
        );
      }
      // Subsequent GET after creation
      return Promise.resolve(
        new Response(JSON.stringify([{ id: 1, identifyingTerms: 'Bob Jones' }]), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      );
    });
    vi.stubGlobal('fetch', fetchSpy);

    render(<Page />);

    const input = screen.getByRole('textbox', { name: /identifying terms/i });
    fireEvent.change(input, { target: { value: 'Bob Jones' } });
    fireEvent.click(screen.getByRole('button', { name: /create case/i }));

    await waitFor(() => {
      expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    });
  });

  it('does not call the API when identifying terms are whitespace-only', async () => {
    const fetchSpy = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>();
    vi.stubGlobal('fetch', fetchSpy);

    render(<Page />);

    const input = screen.getByRole('textbox', { name: /identifying terms/i });
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: /create case/i }));

    await waitFor(() => {
      expect(fetchSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('/api/cases'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });
});
